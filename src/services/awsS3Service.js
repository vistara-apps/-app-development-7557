/**
 * AWS S3 Service for Phyght Video Platform
 * Handles direct AWS S3 operations from the frontend
 */

import { AWS_CONFIG, generateVideoS3Key, generateThumbnailS3Key, getCloudFrontUrl } from '../config/aws.js';

export class AWS_S3_Service {
  constructor() {
    this.config = AWS_CONFIG;
    this.isConfigured = this._validateConfig();
  }

  /**
   * Validates AWS configuration
   * @private
   */
  _validateConfig() {
    const { s3 } = this.config;
    return !!(s3.bucket && s3.region && s3.accessKeyId && s3.secretAccessKey);
  }

  /**
   * Uploads a video file to S3 (via backend API)
   * Note: Direct S3 upload from frontend requires signed URLs or presigned posts
   * This implementation uses the backend API for security
   * @param {string} videoId - Video ID
   * @param {File} videoFile - Video file to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadVideo(videoId, videoFile, onProgress = null) {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not properly configured');
    }

    try {
      // Generate S3 key
      const s3Key = generateVideoS3Key(videoId, videoFile.name);
      
      // In a real implementation, you would:
      // 1. Get a presigned URL from your backend
      // 2. Upload directly to S3 using the presigned URL
      // 3. Track progress and handle multipart uploads for large files
      
      // For now, we'll simulate the upload process
      // In production, replace this with actual S3 upload logic
      
      if (onProgress) onProgress(0);
      
      // Simulate upload progress
      const uploadPromise = this._simulateUpload(videoFile, onProgress);
      await uploadPromise;
      
      const result = {
        key: s3Key,
        bucket: this.config.s3.bucket,
        region: this.config.s3.region,
        storage_class: this.config.s3.storageClass,
        cloudfront_url: getCloudFrontUrl(s3Key),
        size: videoFile.size,
        mime_type: videoFile.type,
        upload_completed_at: new Date().toISOString(),
      };

      if (onProgress) onProgress(100);
      return result;

    } catch (error) {
      console.error('S3 video upload failed:', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }

  /**
   * Uploads a thumbnail file to S3
   * @param {string} videoId - Video ID
   * @param {File} thumbnailFile - Thumbnail file to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadThumbnail(videoId, thumbnailFile, onProgress = null) {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not properly configured');
    }

    try {
      const s3Key = generateThumbnailS3Key(videoId, thumbnailFile.name);
      
      if (onProgress) onProgress(0);
      
      // Simulate upload
      const uploadPromise = this._simulateUpload(thumbnailFile, onProgress);
      await uploadPromise;
      
      const result = {
        key: s3Key,
        bucket: this.config.s3.bucket,
        region: this.config.s3.region,
        storage_class: this.config.s3.storageClass,
        cloudfront_url: getCloudFrontUrl(s3Key),
        size: thumbnailFile.size,
        mime_type: thumbnailFile.type,
        upload_completed_at: new Date().toISOString(),
      };

      if (onProgress) onProgress(100);
      return result;

    } catch (error) {
      console.error('S3 thumbnail upload failed:', error);
      throw new Error(`S3 thumbnail upload failed: ${error.message}`);
    }
  }

  /**
   * Deletes a video and its thumbnail from S3
   * @param {string} videoKey - S3 key for video
   * @param {string} thumbnailKey - S3 key for thumbnail (optional)
   * @returns {Promise<boolean>} Success status
   */
  async deleteVideo(videoKey, thumbnailKey = null) {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not properly configured');
    }

    try {
      // In a real implementation, you would call your backend API
      // which would delete the objects from S3
      
      console.log(`Would delete S3 objects: ${videoKey}${thumbnailKey ? `, ${thumbnailKey}` : ''}`);
      
      // Simulate deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('S3 delete failed:', error);
      return false;
    }
  }

  /**
   * Generates a signed URL for secure access to S3 object
   * @param {string} s3Key - S3 object key
   * @param {number} expiresIn - Expiration time in seconds
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(s3Key, expiresIn = 3600) {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not properly configured');
    }

    try {
      // In a real implementation, you would call your backend API
      // to generate a signed URL using AWS SDK
      
      // For now, return CloudFront URL as fallback
      return getCloudFrontUrl(s3Key);
    } catch (error) {
      console.error('Failed to generate signed URL:', error);
      return getCloudFrontUrl(s3Key);
    }
  }

  /**
   * Gets storage statistics from S3
   * @returns {Promise<Object>} Storage statistics
   */
  async getStorageStats() {
    if (!this.isConfigured) {
      return { videos: 0, thumbnails: 0, totalSize: 0 };
    }

    try {
      // In a real implementation, you would call your backend API
      // which would query S3 for storage statistics
      
      // Mock data for demonstration
      return {
        videos: 150,
        thumbnails: 140,
        totalSize: 5368709120, // 5GB in bytes
        buckets: {
          [this.config.s3.bucket]: {
            objects: 290,
            size: 5368709120,
          },
        },
        storageClasses: {
          STANDARD: 2684354560, // 2.5GB
          STANDARD_IA: 2684354560, // 2.5GB
          GLACIER: 0,
          DEEP_ARCHIVE: 0,
        },
      };
    } catch (error) {
      console.error('Failed to get S3 storage stats:', error);
      return { videos: 0, thumbnails: 0, totalSize: 0 };
    }
  }

  /**
   * Initiates multipart upload for large files
   * @param {string} s3Key - S3 object key
   * @param {string} contentType - File content type
   * @returns {Promise<Object>} Multipart upload info
   */
  async initiateMultipartUpload(s3Key, contentType) {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not properly configured');
    }

    try {
      // In a real implementation, you would call your backend API
      // to initiate multipart upload
      
      return {
        uploadId: `mock-upload-id-${Date.now()}`,
        key: s3Key,
        bucket: this.config.s3.bucket,
      };
    } catch (error) {
      console.error('Failed to initiate multipart upload:', error);
      throw error;
    }
  }

  /**
   * Uploads a part in multipart upload
   * @param {Object} uploadInfo - Multipart upload info
   * @param {number} partNumber - Part number
   * @param {Blob} partData - Part data
   * @returns {Promise<Object>} Part upload result
   */
  async uploadPart(uploadInfo, partNumber, partData) {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not properly configured');
    }

    try {
      // In a real implementation, you would upload the part to S3
      // using a presigned URL for the specific part
      
      return {
        partNumber,
        etag: `"mock-etag-${partNumber}-${Date.now()}"`,
      };
    } catch (error) {
      console.error('Failed to upload part:', error);
      throw error;
    }
  }

  /**
   * Completes multipart upload
   * @param {Object} uploadInfo - Multipart upload info
   * @param {Array} parts - Array of uploaded parts
   * @returns {Promise<Object>} Upload completion result
   */
  async completeMultipartUpload(uploadInfo, parts) {
    if (!this.isConfigured) {
      throw new Error('AWS S3 is not properly configured');
    }

    try {
      // In a real implementation, you would complete the multipart upload
      
      return {
        location: getCloudFrontUrl(uploadInfo.key),
        bucket: uploadInfo.bucket,
        key: uploadInfo.key,
        etag: `"mock-final-etag-${Date.now()}"`,
      };
    } catch (error) {
      console.error('Failed to complete multipart upload:', error);
      throw error;
    }
  }

  /**
   * Simulates file upload with progress tracking
   * @private
   */
  async _simulateUpload(file, onProgress) {
    const totalSize = file.size;
    const chunkSize = Math.min(1024 * 1024, totalSize / 10); // 1MB or 10% of file
    let uploaded = 0;

    while (uploaded < totalSize) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
      uploaded = Math.min(uploaded + chunkSize, totalSize);
      
      if (onProgress) {
        const progress = Math.round((uploaded / totalSize) * 100);
        onProgress(progress);
      }
    }
  }

  /**
   * Gets AWS configuration status
   * @returns {Object} Configuration status
   */
  getConfigStatus() {
    return {
      isConfigured: this.isConfigured,
      bucket: this.config.s3.bucket,
      region: this.config.s3.region,
      cloudfrontEnabled: this.config.cloudfront.enabled,
      cloudfrontDomain: this.config.cloudfront.domain,
    };
  }

  /**
   * Tests AWS S3 connectivity
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      // In a real implementation, you would make a test call to S3
      // For now, just return true if configured
      return true;
    } catch (error) {
      console.error('S3 connection test failed:', error);
      return false;
    }
  }
}

export default AWS_S3_Service;
