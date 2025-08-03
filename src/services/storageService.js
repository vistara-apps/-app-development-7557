/**
 * Storage Service for Phyght Video Platform
 * Provides unified interface for Supabase Storage and AWS S3
 */

import { supabase } from './videoApi.js';
import { AWS_S3_Service } from './awsS3Service.js';
import { getStorageConfig, validateFile, getVideoUrl, getThumbnailUrl } from '../config/storage.js';

class StorageService {
  constructor() {
    this.config = getStorageConfig();
    this.s3Service = new AWS_S3_Service();
  }

  /**
   * Uploads a video file to the configured storage provider
   * @param {string} videoId - Video ID
   * @param {File} videoFile - Video file to upload
   * @param {File} thumbnailFile - Optional thumbnail file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadVideo(videoId, videoFile, thumbnailFile = null, onProgress = null) {
    // Validate files
    const videoValidation = validateFile(videoFile, 'video');
    if (!videoValidation.isValid) {
      throw new Error(`Video validation failed: ${videoValidation.errors.join(', ')}`);
    }

    let thumbnailValidation = null;
    if (thumbnailFile) {
      thumbnailValidation = validateFile(thumbnailFile, 'thumbnail');
      if (!thumbnailValidation.isValid) {
        throw new Error(`Thumbnail validation failed: ${thumbnailValidation.errors.join(', ')}`);
      }
    }

    // Determine storage provider
    const provider = this.config.provider;
    
    try {
      if (provider === 'aws' && this.config.isAWSEnabled) {
        return await this._uploadToAWS(videoId, videoFile, thumbnailFile, onProgress);
      } else {
        return await this._uploadToSupabase(videoId, videoFile, thumbnailFile, onProgress);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Uploads video to AWS S3
   * @private
   */
  async _uploadToAWS(videoId, videoFile, thumbnailFile, onProgress) {
    const results = {};

    // Upload video file
    if (onProgress) onProgress(10);
    const videoResult = await this.s3Service.uploadVideo(videoId, videoFile, (progress) => {
      if (onProgress) onProgress(10 + (progress * 0.7)); // 10-80%
    });

    results.video = videoResult;

    // Upload thumbnail if provided
    if (thumbnailFile) {
      if (onProgress) onProgress(80);
      const thumbnailResult = await this.s3Service.uploadThumbnail(videoId, thumbnailFile, (progress) => {
        if (onProgress) onProgress(80 + (progress * 0.15)); // 80-95%
      });
      results.thumbnail = thumbnailResult;
    }

    if (onProgress) onProgress(100);

    return {
      storage_provider: 'aws',
      s3_key: videoResult.key,
      s3_thumbnail_key: thumbnailFile ? results.thumbnail.key : null,
      cloudfront_url: videoResult.cloudfront_url,
      cloudfront_thumbnail_url: thumbnailFile ? results.thumbnail.cloudfront_url : null,
      file_path: videoResult.key, // For backward compatibility
      thumbnail_path: thumbnailFile ? results.thumbnail.key : null,
      file_size: videoFile.size,
      mime_type: videoFile.type,
      upload_metadata: {
        bucket: videoResult.bucket,
        region: videoResult.region,
        storage_class: videoResult.storage_class,
      },
    };
  }

  /**
   * Uploads video to Supabase Storage
   * @private
   */
  async _uploadToSupabase(videoId, videoFile, thumbnailFile, onProgress) {
    const timestamp = Date.now();
    const videoExtension = videoFile.name.split('.').pop();
    const videoPath = `${videoId}/${timestamp}.${videoExtension}`;
    
    let thumbnailPath = null;
    if (thumbnailFile) {
      const thumbnailExtension = thumbnailFile.name.split('.').pop();
      thumbnailPath = `${videoId}/${timestamp}_thumb.${thumbnailExtension}`;
    }

    try {
      // Upload video file
      if (onProgress) onProgress(20);
      const { data: videoUpload, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (videoError) {
        throw new Error(`Failed to upload video: ${videoError.message}`);
      }

      if (onProgress) onProgress(70);

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

      if (onProgress) onProgress(100);

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

      return {
        storage_provider: 'supabase',
        file_path: videoPath,
        thumbnail_path: thumbnailPath,
        video_url: videoUrl.publicUrl,
        thumbnail_url: thumbnailUrl,
        file_size: videoFile.size,
        mime_type: videoFile.type,
        upload_metadata: {
          supabase_bucket: 'videos',
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
   * Deletes a video from storage
   * @param {Object} video - Video object with storage information
   * @returns {Promise<boolean>} Success status
   */
  async deleteVideo(video) {
    try {
      if (video.storage_provider === 'aws' && video.s3_key) {
        return await this.s3Service.deleteVideo(video.s3_key, video.s3_thumbnail_key);
      } else if (video.file_path) {
        // Delete from Supabase Storage
        const filesToDelete = [video.file_path];
        if (video.thumbnail_path) {
          filesToDelete.push(video.thumbnail_path);
        }

        const { error: videoError } = await supabase.storage
          .from('videos')
          .remove([video.file_path]);

        if (video.thumbnail_path) {
          const { error: thumbError } = await supabase.storage
            .from('thumbnails')
            .remove([video.thumbnail_path]);
        }

        return !videoError;
      }
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  /**
   * Generates a signed URL for secure video access
   * @param {Object} video - Video object
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(video, expiresIn = 3600) {
    try {
      if (video.storage_provider === 'aws' && video.s3_key) {
        return await this.s3Service.getSignedUrl(video.s3_key, expiresIn);
      } else if (video.file_path) {
        // Supabase signed URL
        const { data, error } = await supabase.storage
          .from('videos')
          .createSignedUrl(video.file_path, expiresIn);

        if (error) {
          throw new Error(`Failed to create signed URL: ${error.message}`);
        }

        return data.signedUrl;
      }
      
      // Fallback to public URL
      return getVideoUrl(video);
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return getVideoUrl(video);
    }
  }

  /**
   * Gets storage usage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    const stats = {
      supabase: { videos: 0, thumbnails: 0, totalSize: 0 },
      aws: { videos: 0, thumbnails: 0, totalSize: 0 },
      total: { videos: 0, thumbnails: 0, totalSize: 0 },
    };

    try {
      // Get AWS stats if enabled
      if (this.config.isAWSEnabled) {
        const awsStats = await this.s3Service.getStorageStats();
        stats.aws = awsStats;
      }

      // Get Supabase stats (would need to query database for file counts and sizes)
      // This is a simplified version - in practice, you'd query the videos table
      stats.total.videos = stats.supabase.videos + stats.aws.videos;
      stats.total.thumbnails = stats.supabase.thumbnails + stats.aws.thumbnails;
      stats.total.totalSize = stats.supabase.totalSize + stats.aws.totalSize;

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return stats;
    }
  }

  /**
   * Migrates a video from Supabase to AWS S3
   * @param {Object} video - Video object to migrate
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Migration result
   */
  async migrateVideoToAWS(video, onProgress = null) {
    if (!this.config.isAWSEnabled) {
      throw new Error('AWS S3 is not configured');
    }

    if (video.storage_provider === 'aws') {
      throw new Error('Video is already stored in AWS S3');
    }

    try {
      if (onProgress) onProgress(10);

      // Download from Supabase
      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .download(video.file_path);

      if (videoError) {
        throw new Error(`Failed to download video from Supabase: ${videoError.message}`);
      }

      if (onProgress) onProgress(30);

      let thumbnailData = null;
      if (video.thumbnail_path) {
        const { data: thumbData, error: thumbError } = await supabase.storage
          .from('thumbnails')
          .download(video.thumbnail_path);

        if (!thumbError) {
          thumbnailData = thumbData;
        }
      }

      if (onProgress) onProgress(50);

      // Upload to AWS S3
      const videoFile = new File([videoData], `${video.id}.${video.file_path.split('.').pop()}`, {
        type: video.mime_type,
      });

      let thumbnailFile = null;
      if (thumbnailData) {
        thumbnailFile = new File([thumbnailData], `${video.id}_thumb.${video.thumbnail_path.split('.').pop()}`, {
          type: 'image/jpeg', // Assume JPEG for thumbnails
        });
      }

      const uploadResult = await this._uploadToAWS(video.id, videoFile, thumbnailFile, (progress) => {
        if (onProgress) onProgress(50 + (progress * 0.4)); // 50-90%
      });

      if (onProgress) onProgress(100);

      return {
        success: true,
        ...uploadResult,
        migration_completed_at: new Date().toISOString(),
      };

    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Migration failed: ${error.message}`);
    }
  }

  /**
   * Gets the appropriate video URL based on storage provider
   * @param {Object} video - Video object
   * @returns {string} Video URL
   */
  getVideoUrl(video) {
    return getVideoUrl(video);
  }

  /**
   * Gets the appropriate thumbnail URL based on storage provider
   * @param {Object} video - Video object
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(video) {
    return getThumbnailUrl(video);
  }

  /**
   * Checks if a storage provider is available
   * @param {string} provider - Storage provider ('aws' or 'supabase')
   * @returns {boolean} Availability status
   */
  isProviderAvailable(provider) {
    switch (provider) {
      case 'aws':
        return this.config.isAWSEnabled;
      case 'supabase':
        return true; // Supabase is always available if we're using it
      default:
        return false;
    }
  }

  /**
   * Gets current storage configuration
   * @returns {Object} Storage configuration
   */
  getConfig() {
    return this.config;
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
