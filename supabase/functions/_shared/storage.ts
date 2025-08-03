/**
 * Storage abstraction layer for Supabase Edge Functions
 * Provides unified interface for Supabase Storage and AWS S3
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  uploadToS3, 
  deleteFromS3, 
  getS3SignedUrl, 
  generateVideoS3Key, 
  generateThumbnailS3Key,
  getCloudFrontUrl,
  validateAWSConfig,
  getAWSConfigStatus
} from './aws.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface StorageConfig {
  provider: 'supabase' | 'aws' | 'hybrid';
  awsEnabled: boolean;
  defaultProvider: 'supabase' | 'aws';
}

export interface UploadResult {
  storage_provider: 'supabase' | 'aws';
  file_path?: string;
  thumbnail_path?: string;
  s3_key?: string;
  s3_thumbnail_key?: string;
  s3_bucket?: string;
  s3_region?: string;
  cloudfront_url?: string;
  cloudfront_thumbnail_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  file_size: number;
  mime_type: string;
  upload_metadata: Record<string, any>;
}

/**
 * Gets storage configuration from environment
 */
export function getStorageConfig(): StorageConfig {
  const provider = (Deno.env.get('VITE_STORAGE_PROVIDER') || 'supabase') as 'supabase' | 'aws' | 'hybrid';
  const awsConfig = validateAWSConfig();
  
  return {
    provider,
    awsEnabled: awsConfig.isValid,
    defaultProvider: provider === 'hybrid' ? 'aws' : provider,
  };
}

/**
 * Determines which storage provider to use for new uploads
 */
export function getUploadProvider(config: StorageConfig): 'supabase' | 'aws' {
  switch (config.provider) {
    case 'aws':
      return config.awsEnabled ? 'aws' : 'supabase';
    case 'supabase':
      return 'supabase';
    case 'hybrid':
      return config.awsEnabled ? config.defaultProvider : 'supabase';
    default:
      return 'supabase';
  }
}

/**
 * Uploads video and thumbnail to the configured storage provider
 */
export async function uploadVideo(
  videoId: string,
  videoFile: File,
  thumbnailFile?: File,
  config?: StorageConfig
): Promise<UploadResult> {
  const storageConfig = config || getStorageConfig();
  const provider = getUploadProvider(storageConfig);

  if (provider === 'aws' && storageConfig.awsEnabled) {
    return await uploadToAWS(videoId, videoFile, thumbnailFile);
  } else {
    return await uploadToSupabase(videoId, videoFile, thumbnailFile);
  }
}

/**
 * Uploads video to AWS S3
 */
async function uploadToAWS(
  videoId: string,
  videoFile: File,
  thumbnailFile?: File
): Promise<UploadResult> {
  const awsConfig = getAWSConfigStatus();
  
  // Generate S3 keys
  const videoKey = generateVideoS3Key(videoId, videoFile.name);
  const thumbnailKey = thumbnailFile ? generateThumbnailS3Key(videoId, thumbnailFile.name) : undefined;

  // Convert File to Uint8Array
  const videoBuffer = new Uint8Array(await videoFile.arrayBuffer());
  
  // Upload video
  const videoResult = await uploadToS3(
    videoKey,
    videoBuffer,
    videoFile.type,
    {
      'video-id': videoId,
      'original-filename': videoFile.name,
      'upload-timestamp': new Date().toISOString(),
    }
  );

  let thumbnailResult;
  if (thumbnailFile && thumbnailKey) {
    const thumbnailBuffer = new Uint8Array(await thumbnailFile.arrayBuffer());
    thumbnailResult = await uploadToS3(
      thumbnailKey,
      thumbnailBuffer,
      thumbnailFile.type,
      {
        'video-id': videoId,
        'original-filename': thumbnailFile.name,
        'upload-timestamp': new Date().toISOString(),
      }
    );
  }

  return {
    storage_provider: 'aws',
    s3_key: videoResult.key,
    s3_thumbnail_key: thumbnailResult?.key,
    s3_bucket: awsConfig.bucket,
    s3_region: awsConfig.region,
    cloudfront_url: videoResult.cloudfront_url,
    cloudfront_thumbnail_url: thumbnailResult?.cloudfront_url,
    file_path: videoResult.key, // For backward compatibility
    thumbnail_path: thumbnailResult?.key,
    file_size: videoFile.size,
    mime_type: videoFile.type,
    upload_metadata: {
      aws_upload: true,
      bucket: awsConfig.bucket,
      region: awsConfig.region,
      storage_class: 'STANDARD_IA',
      cloudfront_enabled: awsConfig.cloudfrontEnabled,
    },
  };
}

/**
 * Uploads video to Supabase Storage
 */
async function uploadToSupabase(
  videoId: string,
  videoFile: File,
  thumbnailFile?: File
): Promise<UploadResult> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const timestamp = Date.now();
  const videoExtension = videoFile.name.split('.').pop();
  const videoPath = `${videoId}/${timestamp}.${videoExtension}`;
  
  let thumbnailPath: string | undefined;
  if (thumbnailFile) {
    const thumbnailExtension = thumbnailFile.name.split('.').pop();
    thumbnailPath = `${videoId}/${timestamp}_thumb.${thumbnailExtension}`;
  }

  try {
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
    let thumbnailUpload;
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

    // Get public URLs
    const { data: videoUrl } = supabase.storage
      .from('videos')
      .getPublicUrl(videoPath);

    let thumbnailUrl;
    if (thumbnailPath) {
      const { data: thumbUrl } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(thumbnailPath);
      thumbnailUrl = thumbUrl.publicUrl;
    }

    return {
      storage_provider: 'supabase',
      file_path: videoPath,
      thumbnail_path: thumbnailPath,
      video_url: videoUrl.publicUrl,
      thumbnail_url: thumbnailUrl,
      file_size: videoFile.size,
      mime_type: videoFile.type,
      upload_metadata: {
        supabase_upload: true,
        video_bucket: 'videos',
        thumbnail_bucket: 'thumbnails',
      },
    };

  } catch (error) {
    // Clean up on failure
    if (videoPath) {
      await supabase.storage.from('videos').remove([videoPath]);
    }
    if (thumbnailPath) {
      await supabase.storage.from('thumbnails').remove([thumbnailPath]);
    }
    throw error;
  }
}

/**
 * Deletes video from storage
 */
export async function deleteVideo(
  video: {
    storage_provider?: string;
    s3_key?: string;
    s3_thumbnail_key?: string;
    file_path?: string;
    thumbnail_path?: string;
  }
): Promise<boolean> {
  try {
    if (video.storage_provider === 'aws' && video.s3_key) {
      // Delete from AWS S3
      const videoDeleted = await deleteFromS3(video.s3_key);
      let thumbnailDeleted = true;
      
      if (video.s3_thumbnail_key) {
        thumbnailDeleted = await deleteFromS3(video.s3_thumbnail_key);
      }
      
      return videoDeleted && thumbnailDeleted;
    } else if (video.file_path) {
      // Delete from Supabase Storage
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { error: videoError } = await supabase.storage
        .from('videos')
        .remove([video.file_path]);

      let thumbnailError = null;
      if (video.thumbnail_path) {
        const { error: thumbError } = await supabase.storage
          .from('thumbnails')
          .remove([video.thumbnail_path]);
        thumbnailError = thumbError;
      }

      return !videoError && !thumbnailError;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete video:', error);
    return false;
  }
}

/**
 * Generates signed URL for video access
 */
export async function getVideoSignedUrl(
  video: {
    storage_provider?: string;
    s3_key?: string;
    file_path?: string;
    cloudfront_url?: string;
  },
  expiresIn: number = 3600
): Promise<string> {
  try {
    if (video.storage_provider === 'aws' && video.s3_key) {
      // Use CloudFront URL if available, otherwise generate signed S3 URL
      if (video.cloudfront_url) {
        return video.cloudfront_url;
      }
      return await getS3SignedUrl(video.s3_key, expiresIn);
    } else if (video.file_path) {
      // Generate Supabase signed URL
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(video.file_path, expiresIn);

      if (error) {
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    }
    
    throw new Error('No valid storage path found');
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    throw error;
  }
}

/**
 * Gets the appropriate video URL based on storage provider
 */
export function getVideoUrl(video: {
  storage_provider?: string;
  s3_key?: string;
  file_path?: string;
  cloudfront_url?: string;
  video_url?: string;
}): string | null {
  if (video.cloudfront_url) {
    return video.cloudfront_url;
  }
  
  if (video.storage_provider === 'aws' && video.s3_key) {
    return getCloudFrontUrl(video.s3_key);
  }
  
  if (video.video_url) {
    return video.video_url;
  }
  
  return video.file_path || null;
}

/**
 * Gets the appropriate thumbnail URL based on storage provider
 */
export function getThumbnailUrl(video: {
  storage_provider?: string;
  s3_thumbnail_key?: string;
  thumbnail_path?: string;
  cloudfront_thumbnail_url?: string;
  thumbnail_url?: string;
}): string | null {
  if (video.cloudfront_thumbnail_url) {
    return video.cloudfront_thumbnail_url;
  }
  
  if (video.storage_provider === 'aws' && video.s3_thumbnail_key) {
    return getCloudFrontUrl(video.s3_thumbnail_key);
  }
  
  if (video.thumbnail_url) {
    return video.thumbnail_url;
  }
  
  return video.thumbnail_path || null;
}

/**
 * Migrates video from Supabase to AWS S3
 */
export async function migrateVideoToAWS(
  videoId: string,
  supabaseVideoPath: string,
  supabaseThumbnailPath?: string
): Promise<{
  success: boolean;
  s3_key?: string;
  s3_thumbnail_key?: string;
  cloudfront_url?: string;
  cloudfront_thumbnail_url?: string;
  error?: string;
}> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const awsConfig = validateAWSConfig();
    
    if (!awsConfig.isValid) {
      throw new Error('AWS not configured for migration');
    }

    // Download from Supabase
    const { data: videoData, error: videoError } = await supabase.storage
      .from('videos')
      .download(supabaseVideoPath);

    if (videoError) {
      throw new Error(`Failed to download video: ${videoError.message}`);
    }

    let thumbnailData;
    if (supabaseThumbnailPath) {
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('thumbnails')
        .download(supabaseThumbnailPath);
      
      if (!thumbError) {
        thumbnailData = thumbData;
      }
    }

    // Generate S3 keys
    const videoKey = generateVideoS3Key(videoId, supabaseVideoPath);
    const thumbnailKey = supabaseThumbnailPath ? generateThumbnailS3Key(videoId, supabaseThumbnailPath) : undefined;

    // Upload to S3
    const videoBuffer = new Uint8Array(await videoData.arrayBuffer());
    const videoResult = await uploadToS3(
      videoKey,
      videoBuffer,
      'video/mp4', // Default, should be detected from original
      {
        'migrated-from': 'supabase',
        'original-path': supabaseVideoPath,
        'migration-timestamp': new Date().toISOString(),
      }
    );

    let thumbnailResult;
    if (thumbnailData && thumbnailKey) {
      const thumbnailBuffer = new Uint8Array(await thumbnailData.arrayBuffer());
      thumbnailResult = await uploadToS3(
        thumbnailKey,
        thumbnailBuffer,
        'image/jpeg', // Default for thumbnails
        {
          'migrated-from': 'supabase',
          'original-path': supabaseThumbnailPath,
          'migration-timestamp': new Date().toISOString(),
        }
      );
    }

    return {
      success: true,
      s3_key: videoResult.key,
      s3_thumbnail_key: thumbnailResult?.key,
      cloudfront_url: videoResult.cloudfront_url,
      cloudfront_thumbnail_url: thumbnailResult?.cloudfront_url,
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gets storage provider status
 */
export function getStorageStatus() {
  const config = getStorageConfig();
  const awsStatus = getAWSConfigStatus();
  
  return {
    current_provider: config.provider,
    default_provider: config.defaultProvider,
    aws_enabled: config.awsEnabled,
    aws_config: awsStatus,
    supabase_enabled: true, // Always available
  };
}
