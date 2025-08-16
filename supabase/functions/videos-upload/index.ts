import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, createResponse, createErrorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, requireAdminOrModerator } from '../_shared/auth.ts';
import { uploadVideo, getStorageConfig, getStorageStatus } from '../_shared/storage.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const user = await getAuthenticatedUser(req);
    
    // Allow uploads without authentication for guest users
    // This enables video uploads without requiring login or wallet connection
    if (req.method === 'POST') {
      return await handleVideoUpload(req, supabase, user);
    } else if (req.method === 'PUT') {
      return await handleUploadComplete(req, supabase, user);
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Error in video upload function:', error);
    return createErrorResponse(error.message, 500);
  }
});

async function handleVideoUpload(req: Request, supabase: any, user: any) {
  const formData = await req.formData();
  const videoFile = formData.get('video') as File;
  const videoId = formData.get('videoId') as string;
  const thumbnailFile = formData.get('thumbnail') as File;

  if (!videoFile || !videoId) {
    return createErrorResponse('Video file and video ID are required');
  }

  // Validate file type
  const allowedVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime'
  ];

  if (!allowedVideoTypes.includes(videoFile.type)) {
    return createErrorResponse('Invalid video file type. Supported formats: MP4, WebM, OGG, AVI, MOV');
  }

  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (videoFile.size > maxSize) {
    return createErrorResponse('Video file too large. Maximum size is 50MB');
  }

  try {
    // Get storage configuration
    const storageConfig = getStorageConfig();
    console.log('Using storage provider:', storageConfig.provider);

    // Upload using storage abstraction layer
    const uploadResult = await uploadVideo(videoId, videoFile, thumbnailFile, storageConfig);

    // Update video record with upload results
    const updateData: any = {
      file_size: uploadResult.file_size,
      mime_type: uploadResult.mime_type,
      status: 'processing',
      upload_metadata: uploadResult.upload_metadata,
    };

    // Only add last_modified_by if we have a valid user UUID
    if (user?.id) {
      updateData.last_modified_by = user.id;
    }

    // Add storage-specific fields
    if (uploadResult.storage_provider === 'aws') {
      updateData.storage_provider = 'aws';
      updateData.s3_key = uploadResult.s3_key;
      updateData.s3_thumbnail_key = uploadResult.s3_thumbnail_key;
      updateData.s3_bucket = uploadResult.s3_bucket;
      updateData.s3_region = uploadResult.s3_region;
      updateData.cloudfront_url = uploadResult.cloudfront_url;
      updateData.cloudfront_thumbnail_url = uploadResult.cloudfront_thumbnail_url;
      updateData.storage_class = 'STANDARD_IA';
      // Keep file_path for backward compatibility
      updateData.file_path = uploadResult.s3_key;
      updateData.thumbnail_path = uploadResult.s3_thumbnail_key;
    } else {
      updateData.storage_provider = 'supabase';
      updateData.file_path = uploadResult.file_path;
      updateData.thumbnail_path = uploadResult.thumbnail_path;
    }

    const { data: video, error: updateError } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .select(`
        id,
        title,
        description,
        file_path,
        thumbnail_path,
        duration,
        file_size,
        mime_type,
        status,
        tags,
        category,
        is_featured,
        view_count,
        vector_clock,
        version,
        storage_provider,
        s3_key,
        s3_thumbnail_key,
        s3_bucket,
        s3_region,
        cloudfront_url,
        cloudfront_thumbnail_url,
        storage_class,
        upload_metadata,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      throw new Error(`Failed to update video record: ${updateError.message}`);
    }

    // Create processing job
    await supabase.from('video_processing').insert({
      video_id: videoId,
      quality: '1080p', // Default quality
      status: 'processing',
      progress: 0,
    });

    // Log CRDT operation
    await supabase.from('crdt_operations').insert({
      video_id: videoId,
      operation_type: 'upload_video',
      operation_data: {
        storage_provider: uploadResult.storage_provider,
        file_path: uploadResult.file_path,
        thumbnail_path: uploadResult.thumbnail_path,
        s3_key: uploadResult.s3_key,
        s3_thumbnail_key: uploadResult.s3_thumbnail_key,
        file_size: uploadResult.file_size,
        mime_type: uploadResult.mime_type,
        upload_metadata: uploadResult.upload_metadata,
      },
      vector_clock: video.vector_clock,
      actor_id: user.id,
    });

    // Prepare response with appropriate URLs
    const responseData = {
      ...video,
      upload_status: 'success',
      storage_status: getStorageStatus(),
    };

    // Add URLs based on storage provider
    if (uploadResult.storage_provider === 'aws') {
      responseData.video_url = uploadResult.cloudfront_url || uploadResult.s3_key;
      responseData.thumbnail_url = uploadResult.cloudfront_thumbnail_url || uploadResult.s3_thumbnail_key;
    } else {
      responseData.video_url = uploadResult.video_url;
      responseData.thumbnail_url = uploadResult.thumbnail_url;
    }

    return createResponse(responseData);

  } catch (error) {
    console.error('Upload error:', error);
    return createErrorResponse(error.message, 500);
  }
}

async function handleUploadComplete(req: Request, supabase: any, user: any) {
  const body = await req.json();
  const { videoId, duration, processingResults } = body;

  if (!videoId) {
    return createErrorResponse('Video ID is required');
  }

  try {
    // Update video with processing results
    const updateData: any = {
      status: 'ready',
      last_modified_by: user.id,
    };

    if (duration) {
      updateData.duration = duration;
    }

    const { data: video, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .select(`
        id,
        title,
        description,
        file_path,
        thumbnail_path,
        duration,
        file_size,
        mime_type,
        status,
        tags,
        category,
        is_featured,
        view_count,
        vector_clock,
        version,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update video: ${error.message}`);
    }

    // Update processing job
    await supabase
      .from('video_processing')
      .update({
        status: 'ready',
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('video_id', videoId);

    // Log CRDT operation
    await supabase.from('crdt_operations').insert({
      video_id: videoId,
      operation_type: 'complete_processing',
      operation_data: {
        duration,
        processing_results: processingResults,
      },
      vector_clock: video.vector_clock,
      actor_id: user.id,
    });

    return createResponse({
      ...video,
      processing_complete: true,
    });

  } catch (error) {
    console.error('Upload complete error:', error);
    return createErrorResponse(error.message, 500);
  }
}
