import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, createResponse, createErrorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, requireAdminOrModerator } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const user = await getAuthenticatedUser(req);
    requireAdminOrModerator(user);

    if (req.method === 'POST') {
      return await handleVideoUpload(req, supabase, user!);
    } else if (req.method === 'PUT') {
      return await handleUploadComplete(req, supabase, user!);
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
    // Generate unique file paths
    const timestamp = Date.now();
    const videoExtension = videoFile.name.split('.').pop();
    const videoPath = `${videoId}/${timestamp}.${videoExtension}`;
    
    let thumbnailPath = null;
    if (thumbnailFile) {
      const thumbnailExtension = thumbnailFile.name.split('.').pop();
      thumbnailPath = `${videoId}/${timestamp}_thumb.${thumbnailExtension}`;
    }

    // Upload video file
    const { data: videoUpload, error: videoError } = await supabase.storage
      .from('videos')
      .upload(videoPath, videoFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (videoError) {
      throw new Error(`Failed to upload video: ${videoError.message}`);
    }

    // Upload thumbnail if provided
    let thumbnailUpload = null;
    if (thumbnailFile && thumbnailPath) {
      const { data: thumbUpload, error: thumbError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbnailPath, thumbnailFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (thumbError) {
        console.warn('Failed to upload thumbnail:', thumbError.message);
      } else {
        thumbnailUpload = thumbUpload;
      }
    }

    // Update video record with file paths
    const { data: video, error: updateError } = await supabase
      .from('videos')
      .update({
        file_path: videoPath,
        thumbnail_path: thumbnailPath,
        file_size: videoFile.size,
        mime_type: videoFile.type,
        status: 'processing',
        last_modified_by: user.id,
      })
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

    if (updateError) {
      // Clean up uploaded files if database update fails
      await supabase.storage.from('videos').remove([videoPath]);
      if (thumbnailPath) {
        await supabase.storage.from('thumbnails').remove([thumbnailPath]);
      }
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
        file_path: videoPath,
        thumbnail_path: thumbnailPath,
        file_size: videoFile.size,
        mime_type: videoFile.type,
      },
      vector_clock: video.vector_clock,
      actor_id: user.id,
    });

    // Get public URLs
    const { data: videoUrl } = supabase.storage
      .from('videos')
      .getPublicUrl(videoPath);

    let thumbnailUrl = null;
    if (thumbnailPath) {
      const { data: thumbUrl } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(thumbnailPath);
      thumbnailUrl = thumbUrl.publicUrl;
    }

    return createResponse({
      ...video,
      video_url: videoUrl.publicUrl,
      thumbnail_url: thumbnailUrl,
      upload_status: 'success',
    });

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
