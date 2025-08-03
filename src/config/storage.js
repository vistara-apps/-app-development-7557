/**
 * Storage Configuration for Phyght Video Platform
 * Centralized configuration for all storage providers
 */

import { AWS_CONFIG, getStorageProvider, isAWSConfigured } from './aws.js';

export const STORAGE_CONFIG = {
  // Storage Providers
  providers: {
    SUPABASE: 'supabase',
    AWS: 'aws',
    HYBRID: 'hybrid',
  },

  // Current provider configuration
  current: {
    provider: getStorageProvider(),
    isAWSEnabled: isAWSConfigured(),
    migrationEnabled: AWS_CONFIG.storage.enableMigration,
  },

  // File type configurations
  fileTypes: {
    video: {
      maxSize: AWS_CONFIG.files.maxVideoSize,
      supportedFormats: AWS_CONFIG.files.supportedVideoFormats,
      allowedExtensions: ['mp4', 'webm', 'ogg', 'avi', 'mov', 'quicktime'],
    },
    thumbnail: {
      maxSize: AWS_CONFIG.files.maxThumbnailSize,
      supportedFormats: AWS_CONFIG.files.supportedImageFormats,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    },
  },

  // Upload configurations
  upload: {
    chunkSize: 5 * 1024 * 1024, // 5MB chunks for multipart upload
    maxConcurrentUploads: 3,
    retryAttempts: 3,
    retryDelay: 1000, // ms
  },

  // Storage paths
  paths: {
    supabase: {
      videos: 'videos',
      thumbnails: 'thumbnails',
    },
    aws: {
      videos: AWS_CONFIG.buckets.videos.prefix,
      thumbnails: AWS_CONFIG.buckets.thumbnails.prefix,
      processed: AWS_CONFIG.buckets.processed.prefix,
    },
  },

  // CDN Configuration
  cdn: {
    enabled: AWS_CONFIG.cloudfront.enabled,
    domain: AWS_CONFIG.cloudfront.domain,
    cacheControl: 'public, max-age=31536000', // 1 year
    signedUrlExpiry: 3600, // 1 hour
  },

  // Quality settings for video processing
  videoQualities: [
    {
      name: '720p',
      width: 1280,
      height: 720,
      bitrate: '2500k',
      suffix: '_720p',
    },
    {
      name: '1080p',
      width: 1920,
      height: 1080,
      bitrate: '5000k',
      suffix: '_1080p',
    },
    {
      name: '4K',
      width: 3840,
      height: 2160,
      bitrate: '15000k',
      suffix: '_4k',
    },
  ],

  // Storage classes for AWS S3
  storageClasses: {
    STANDARD: 'STANDARD',
    STANDARD_IA: 'STANDARD_IA',
    GLACIER: 'GLACIER',
    DEEP_ARCHIVE: 'DEEP_ARCHIVE',
  },
};

/**
 * Gets the appropriate storage configuration based on current provider
 * @returns {Object} Storage configuration
 */
export function getStorageConfig() {
  const { current } = STORAGE_CONFIG;
  
  return {
    provider: current.provider,
    isAWSEnabled: current.isAWSEnabled,
    migrationEnabled: current.migrationEnabled,
    paths: STORAGE_CONFIG.paths[current.provider] || STORAGE_CONFIG.paths.supabase,
    cdn: STORAGE_CONFIG.cdn,
    upload: STORAGE_CONFIG.upload,
  };
}

/**
 * Validates file type and size
 * @param {File} file - File to validate
 * @param {string} type - File type ('video' or 'thumbnail')
 * @returns {Object} Validation result
 */
export function validateFile(file, type) {
  const config = STORAGE_CONFIG.fileTypes[type];
  const errors = [];

  if (!config) {
    errors.push(`Invalid file type: ${type}`);
    return { isValid: false, errors };
  }

  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    errors.push(`File size exceeds maximum limit of ${maxSizeMB}MB`);
  }

  // Check file format
  if (!config.supportedFormats.includes(file.type)) {
    errors.push(`Unsupported file format: ${file.type}. Supported formats: ${config.supportedFormats.join(', ')}`);
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    errors.push(`Unsupported file extension: ${extension}. Allowed extensions: ${config.allowedExtensions.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension,
    },
  };
}

/**
 * Gets the appropriate URL for a video based on storage provider
 * @param {Object} video - Video object from database
 * @returns {string} Video URL
 */
export function getVideoUrl(video) {
  if (!video) return null;

  // If video has CloudFront URL, use it
  if (video.cloudfront_url) {
    return video.cloudfront_url;
  }

  // If video is stored in AWS S3
  if (video.storage_provider === 'aws' && video.s3_key) {
    return getCloudFrontUrl(video.s3_key);
  }

  // If video has Supabase storage path
  if (video.file_path && video.storage_provider === 'supabase') {
    // This would be handled by Supabase client
    return video.file_path;
  }

  // Fallback to file_path
  return video.file_path;
}

/**
 * Gets the appropriate thumbnail URL for a video
 * @param {Object} video - Video object from database
 * @returns {string} Thumbnail URL
 */
export function getThumbnailUrl(video) {
  if (!video) return null;

  // If video has CloudFront thumbnail URL
  if (video.cloudfront_thumbnail_url) {
    return video.cloudfront_thumbnail_url;
  }

  // If thumbnail is stored in AWS S3
  if (video.storage_provider === 'aws' && video.s3_thumbnail_key) {
    return getCloudFrontUrl(video.s3_thumbnail_key);
  }

  // If video has Supabase thumbnail path
  if (video.thumbnail_path && video.storage_provider === 'supabase') {
    return video.thumbnail_path;
  }

  // Fallback to thumbnail_path
  return video.thumbnail_path;
}

/**
 * Determines if a video should be migrated to AWS S3
 * @param {Object} video - Video object from database
 * @returns {boolean} True if video should be migrated
 */
export function shouldMigrateVideo(video) {
  const { current } = STORAGE_CONFIG;
  
  // Migration must be enabled
  if (!current.migrationEnabled || !current.isAWSEnabled) {
    return false;
  }

  // Video must be stored in Supabase
  if (video.storage_provider !== 'supabase' && video.storage_provider !== null) {
    return false;
  }

  // Video must have a file path
  if (!video.file_path) {
    return false;
  }

  // Video must be in ready status
  if (video.status !== 'ready') {
    return false;
  }

  // Video must not already be migrated
  if (video.migration_status === 'completed') {
    return false;
  }

  return true;
}

/**
 * Gets storage metrics for monitoring
 * @returns {Object} Storage metrics configuration
 */
export function getStorageMetrics() {
  return {
    providers: Object.values(STORAGE_CONFIG.providers),
    currentProvider: STORAGE_CONFIG.current.provider,
    isAWSEnabled: STORAGE_CONFIG.current.isAWSEnabled,
    migrationEnabled: STORAGE_CONFIG.current.migrationEnabled,
    fileTypes: Object.keys(STORAGE_CONFIG.fileTypes),
    videoQualities: STORAGE_CONFIG.videoQualities.map(q => q.name),
    storageClasses: Object.keys(STORAGE_CONFIG.storageClasses),
  };
}

// Helper function import
function getCloudFrontUrl(s3Key) {
  const { cloudfront, s3 } = AWS_CONFIG;
  
  if (cloudfront.enabled && cloudfront.domain) {
    return `https://${cloudfront.domain}/${s3Key}`;
  }
  
  return `https://${s3.bucket}.s3.${s3.region}.amazonaws.com/${s3Key}`;
}

export default STORAGE_CONFIG;
