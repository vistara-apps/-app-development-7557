/**
 * AWS Configuration for Phyght Video Platform
 * Handles AWS S3 and CloudFront configuration
 */

export const AWS_CONFIG = {
  // S3 Configuration
  s3: {
    region: import.meta.env.VITE_AWS_S3_REGION || 'us-east-1',
    bucket: import.meta.env.VITE_AWS_S3_BUCKET,
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    storageClass: import.meta.env.VITE_S3_STORAGE_CLASS || 'STANDARD_IA',
    lifecycleEnabled: import.meta.env.VITE_S3_LIFECYCLE_ENABLED === 'true',
  },

  // CloudFront Configuration
  cloudfront: {
    domain: import.meta.env.VITE_AWS_CLOUDFRONT_DOMAIN,
    enabled: !!import.meta.env.VITE_AWS_CLOUDFRONT_DOMAIN,
  },

  // Storage Provider Configuration
  storage: {
    provider: import.meta.env.VITE_STORAGE_PROVIDER || 'supabase', // 'supabase', 'aws', 'hybrid'
    enableMigration: import.meta.env.VITE_ENABLE_S3_MIGRATION === 'true',
    defaultProvider: 'aws', // Default for new uploads when using hybrid mode
  },

  // File Configuration
  files: {
    maxVideoSize: parseInt(import.meta.env.VITE_MAX_VIDEO_SIZE) || 52428800, // 50MB
    maxThumbnailSize: parseInt(import.meta.env.VITE_MAX_THUMBNAIL_SIZE) || 5242880, // 5MB
    supportedVideoFormats: (import.meta.env.VITE_SUPPORTED_VIDEO_FORMATS || 'video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime').split(','),
    supportedImageFormats: (import.meta.env.VITE_SUPPORTED_IMAGE_FORMATS || 'image/jpeg,image/png,image/webp').split(','),
  },

  // S3 Bucket Structure
  buckets: {
    videos: {
      name: import.meta.env.VITE_AWS_S3_BUCKET,
      prefix: 'videos/',
    },
    thumbnails: {
      name: import.meta.env.VITE_AWS_S3_BUCKET,
      prefix: 'thumbnails/',
    },
    processed: {
      name: import.meta.env.VITE_AWS_S3_BUCKET,
      prefix: 'processed/',
    },
  },

  // Lifecycle Policies
  lifecycle: {
    transitionToIA: 30, // days
    transitionToGlacier: 90, // days
    deleteAfter: 2555, // days (7 years)
  },
};

/**
 * Validates AWS configuration
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateAWSConfig() {
  const errors = [];
  const config = AWS_CONFIG;

  // Check required S3 configuration
  if (!config.s3.bucket) {
    errors.push('AWS S3 bucket name is required (VITE_AWS_S3_BUCKET)');
  }

  if (!config.s3.region) {
    errors.push('AWS S3 region is required (VITE_AWS_S3_REGION)');
  }

  if (!config.s3.accessKeyId) {
    errors.push('AWS Access Key ID is required (VITE_AWS_ACCESS_KEY_ID)');
  }

  if (!config.s3.secretAccessKey) {
    errors.push('AWS Secret Access Key is required (VITE_AWS_SECRET_ACCESS_KEY)');
  }

  // Validate storage provider
  const validProviders = ['supabase', 'aws', 'hybrid'];
  if (!validProviders.includes(config.storage.provider)) {
    errors.push(`Invalid storage provider: ${config.storage.provider}. Must be one of: ${validProviders.join(', ')}`);
  }

  // Validate file sizes
  if (config.files.maxVideoSize < 1024 * 1024) { // Minimum 1MB
    errors.push('Maximum video size must be at least 1MB');
  }

  if (config.files.maxThumbnailSize < 1024 * 100) { // Minimum 100KB
    errors.push('Maximum thumbnail size must be at least 100KB');
  }

  return {
    isValid: errors.length === 0,
    errors,
    config,
  };
}

/**
 * Gets the appropriate storage provider for new uploads
 * @returns {string} Storage provider ('supabase' or 'aws')
 */
export function getStorageProvider() {
  const { storage } = AWS_CONFIG;
  
  switch (storage.provider) {
    case 'aws':
      return 'aws';
    case 'supabase':
      return 'supabase';
    case 'hybrid':
      return storage.defaultProvider;
    default:
      return 'supabase';
  }
}

/**
 * Checks if AWS S3 is properly configured
 * @returns {boolean} True if AWS S3 is configured
 */
export function isAWSConfigured() {
  const { isValid } = validateAWSConfig();
  return isValid;
}

/**
 * Gets CloudFront URL for a given S3 key
 * @param {string} s3Key - S3 object key
 * @returns {string} CloudFront URL or S3 URL if CloudFront not configured
 */
export function getCloudFrontUrl(s3Key) {
  const { cloudfront, s3 } = AWS_CONFIG;
  
  if (cloudfront.enabled && cloudfront.domain) {
    return `https://${cloudfront.domain}/${s3Key}`;
  }
  
  // Fallback to S3 URL
  return `https://${s3.bucket}.s3.${s3.region}.amazonaws.com/${s3Key}`;
}

/**
 * Generates S3 key for video files
 * @param {string} videoId - Video ID
 * @param {string} filename - Original filename
 * @param {string} quality - Video quality (optional)
 * @returns {string} S3 key
 */
export function generateVideoS3Key(videoId, filename, quality = null) {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  const qualitySuffix = quality ? `_${quality}` : '';
  
  return `${AWS_CONFIG.buckets.videos.prefix}${videoId}/${timestamp}${qualitySuffix}.${extension}`;
}

/**
 * Generates S3 key for thumbnail files
 * @param {string} videoId - Video ID
 * @param {string} filename - Original filename
 * @returns {string} S3 key
 */
export function generateThumbnailS3Key(videoId, filename) {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  
  return `${AWS_CONFIG.buckets.thumbnails.prefix}${videoId}/${timestamp}_thumb.${extension}`;
}

export default AWS_CONFIG;
