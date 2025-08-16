/**
 * Simple Video Upload Service for Deployment
 * Handles video uploads without complex dependencies
 */

import { supabase } from './videoApi.js';
import videoAnalysisService from './videoAnalysis.js';

class SimpleVideoUploadService {
  constructor() {
    this.isUploading = false;
  }

  /**
   * Upload video with simple approach that works in deployment
   * @param {Object} videoData - Video metadata
   * @param {File} videoFile - Video file to upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Upload result
   */
  async uploadVideo(videoData, videoFile, onProgress = null) {
    if (this.isUploading) {
      throw new Error('Another upload is already in progress');
    }

    this.isUploading = true;

    try {
      console.log('🎬 Starting simple video upload:', videoData.title);

      if (onProgress) onProgress(10, 'Preparing upload...');

      // Step 1: Create video record in database
      const videoRecord = await this._createVideoRecord(videoData);
      const videoId = videoRecord.id;

      if (onProgress) onProgress(20, 'Video record created...');

      // Step 2: Analyze video file
      const [videoAnalysis, thumbnailUrl] = await Promise.all([
        videoAnalysisService.analyzeVideo(videoFile),
        videoAnalysisService.generateThumbnail(videoFile)
      ]);

      if (onProgress) onProgress(30, 'Video analyzed...');

      // Step 3: Upload to Supabase Storage (most reliable for deployment)
      const uploadResult = await this._uploadToSupabaseStorage(
        videoId, 
        videoFile, 
        null, // No separate thumbnail file for now
        onProgress
      );

      if (onProgress) onProgress(90, 'Finalizing upload...');

      // Step 4: Update video record with upload details
      const finalVideo = await this._updateVideoRecord(videoId, {
        file_path: uploadResult.file_path,
        file_size: videoFile.size,
        mime_type: videoFile.type,
        duration: this._parseDurationToSeconds(videoAnalysis.duration),
        status: 'ready',
        thumbnail_path: thumbnailUrl
      });

      if (onProgress) onProgress(100, 'Upload complete!');

      console.log('✅ Simple video upload completed:', finalVideo.title);

      return {
        id: finalVideo.id,
        title: finalVideo.title,
        description: finalVideo.description,
        file_path: finalVideo.file_path,
        thumbnail_path: thumbnailUrl,
        duration: videoAnalysis.duration,
        status: 'ready',
        contentFile: this._getPublicUrl(finalVideo.file_path),
        previewThumbnail: thumbnailUrl,
        ...videoAnalysis
      };

    } catch (error) {
      console.error('❌ Simple video upload failed:', error);
      if (onProgress) onProgress(0, `Upload failed: ${error.message}`);
      throw error;
    } finally {
      this.isUploading = false;
    }
  }

  /**
   * Create video record in database
   * @private
   */
  async _createVideoRecord(videoData) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert({
          title: videoData.title || 'Untitled Video',
          description: videoData.description || '',
          category: videoData.category || 'combat-sports',
          tags: videoData.tags || [],
          is_featured: videoData.is_featured || false,
          status: 'uploading',
          last_modified_by: videoData.uploadedBy || 'guest',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create video record: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to create video record:', error);
      throw error;
    }
  }

  /**
   * Upload to Supabase Storage
   * @private
   */
  async _uploadToSupabaseStorage(videoId, videoFile, thumbnailFile, onProgress) {
    try {
      const timestamp = Date.now();
      const videoExtension = videoFile.name.split('.').pop();
      const videoPath = `${videoId}/${timestamp}.${videoExtension}`;

      console.log('📤 Uploading to Supabase Storage:', videoPath);

      if (onProgress) onProgress(40, 'Uploading video file...');

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

      if (onProgress) onProgress(80, 'Video uploaded successfully...');

      return {
        file_path: videoPath,
        storage_provider: 'supabase'
      };

    } catch (error) {
      console.error('❌ Supabase storage upload failed:', error);
      throw error;
    }
  }

  /**
   * Update video record with upload details
   * @private
   */
  async _updateVideoRecord(videoId, updateData) {
    try {
      const { data, error } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', videoId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update video record: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to update video record:', error);
      throw error;
    }
  }

  /**
   * Get public URL for video file
   * @private
   */
  _getPublicUrl(filePath) {
    try {
      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('❌ Failed to get public URL:', error);
      return null;
    }
  }

  /**
   * Parse duration string to seconds
   * @private
   */
  _parseDurationToSeconds(durationString) {
    try {
      if (!durationString || durationString === '0:00') return 0;
      
      const parts = durationString.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Failed to parse duration:', error);
      return 0;
    }
  }

  /**
   * Check if service is ready for uploads
   */
  isReady() {
    return !this.isUploading && !!supabase;
  }

  /**
   * Get upload status
   */
  getUploadStatus() {
    return {
      isUploading: this.isUploading,
      isReady: this.isReady()
    };
  }
}

// Export singleton instance
export const simpleVideoUploadService = new SimpleVideoUploadService();
export default simpleVideoUploadService;
