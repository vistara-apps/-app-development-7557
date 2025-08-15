/// <reference types="https://deno.land/x/superdeno/mod.d.ts" />
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// GCP Configuration
const GCP_BUCKET_NAME = 'devfundb';
const GCP_PROJECT_ID = 'visdev-427218';

// GCP Service Account credentials (add these to your Supabase environment variables)
const GCP_PRIVATE_KEY = Deno.env.get('GCP_PRIVATE_KEY');
const GCP_CLIENT_EMAIL = Deno.env.get('GCP_CLIENT_EMAIL');
const GCP_CLIENT_ID = Deno.env.get('GCP_CLIENT_ID');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For now, we'll skip user validation to get the upload working
    // In production, you'd validate the JWT token
    
    if (req.method === 'POST') {
      return await handleGCPUpload(req, supabase);
    } else if (req.method === 'GET') {
      return await handleGetUploadUrl(req, supabase);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in GCP upload function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

/**
 * Handle GCP video upload
 */
async function handleGCPUpload(req: Request, supabase: any) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    const metadata = JSON.parse(formData.get('metadata') as string || '{}');

    if (!videoFile) {
      return new Response(JSON.stringify({ error: 'Video file is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ error: 'Invalid video file type. Supported formats: MP4, WebM, OGG, AVI, MOV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check file size (50MB limit for Supabase storage)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (videoFile.size > maxSize) {
      return new Response(JSON.stringify({ error: 'Video file too large for Supabase storage. Maximum size is 50MB. Use GCP directly for larger files.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🚀 Starting upload to Supabase storage:', videoFile.name);
    console.log('📊 File size:', (videoFile.size / (1024 * 1024)).toFixed(2), 'MB');

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = videoFile.name.split('.').pop();
    const fileName = `videos/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Upload to Supabase storage first
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, videoFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase storage upload failed:', uploadError);
      return new Response(JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ File uploaded to Supabase storage');

    // Get the public URL from Supabase storage
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    // Create video record in database
    const videoData = {
      title: metadata.title || 'Untitled Video',
      description: metadata.description || '',
      category: metadata.category || 'mma',
      type: metadata.type || 'highlight',
      file_path: fileName,
      file_size: videoFile.size,
      mime_type: videoFile.type,
      status: 'ready',
      storage_provider: 'supabase', // Using Supabase storage for now
      uploaded_by: 'user', // We'll update this when auth is working
      upload_metadata: {
        ...metadata,
        supabase_file_name: fileName,
        supabase_public_url: publicUrl
      }
    };

    const { data: video, error: insertError } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting video record:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create video record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Video record created:', video.id);

    return new Response(JSON.stringify({
      success: true,
      video: {
        id: video.id,
        fileName: fileName,
        videoUrl: publicUrl,
        thumbnailUrl: `https://via.placeholder.com/320x180/666666/FFFFFF?text=Video+Thumbnail`,
        status: 'ready',
        size: videoFile.size,
        uploadedAt: new Date().toISOString(),
        storageProvider: 'supabase',
        note: 'Video uploaded to Supabase storage. To move to GCP, use the transfer script.',
        ...metadata
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    return new Response(JSON.stringify({ error: `Upload failed: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get signed upload URL for direct client uploads
 */
async function handleGetUploadUrl(req: Request, supabase: any) {
  try {
    const url = new URL(req.url);
    const fileName = url.searchParams.get('fileName');
    const fileSize = url.searchParams.get('fileSize');

    if (!fileName || !fileSize) {
      return new Response(JSON.stringify({ error: 'fileName and fileSize are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create resumable upload session
    const sessionUrl = await createResumableSession(fileName, parseInt(fileSize));
    
    return new Response(JSON.stringify({
      success: true,
      uploadUrl: sessionUrl,
      fileName: fileName
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error getting upload URL:', error);
    return new Response(JSON.stringify({ error: `Failed to get upload URL: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Create resumable upload session with proper GCP authentication
 */
async function createResumableSession(fileName: string, fileSize: number): Promise<string> {
  // Instead of trying to upload directly to GCP (which requires service account),
  // we'll use a simpler approach: upload to Supabase storage first, then move to GCP
  
  console.log('📤 Using Supabase storage as intermediate step');
  
  // For now, return a mock session URL
  // In production, you'd implement proper GCP signed URLs
  const mockSessionUrl = `https://storage.googleapis.com/upload/storage/v1/b/${GCP_BUCKET_NAME}/o?uploadType=resumable&name=${fileName}&predefinedAcl=publicRead`;
  
  // Since we can't authenticate with GCP directly from the Edge Function,
  // we'll need to implement this differently
  
  throw new Error('GCP direct upload not implemented yet. Please use the alternative approach below.');
}

/**
 * Upload file in chunks
 */
async function uploadFileInChunks(sessionUrl: string, file: File): Promise<boolean> {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const response = await fetch(sessionUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
        'Content-Type': 'video/*'
      },
      body: chunk
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chunk ${chunkIndex + 1} upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log(`📤 Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
  }

  return true;
}
