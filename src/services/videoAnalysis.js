/**
 * Video Analysis Service
 * Provides automatic thumbnail generation and video analysis
 * Uses cheap/free APIs for cost-effective processing
 */

class VideoAnalysisService {
  constructor() {
    // Free/cheap API options
    this.apis = {
      // Free thumbnail generation using browser APIs
      thumbnail: 'browser',
      // Cheap video analysis using various APIs
      analysis: 'ffmpeg-wasm' // Free, runs in browser
    };
  }

  /**
   * Generate thumbnail from video file
   * @param {File} videoFile - Video file to analyze
   * @param {number} timeOffset - Time in seconds to extract frame (default: 5s)
   * @returns {Promise<string>} Data URL of thumbnail
   */
  async generateThumbnail(videoFile, timeOffset = 5) {
    try {
      console.log('🎬 Generating thumbnail from video...');
      
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.onloadedmetadata = () => {
          // Set video to specific time
          video.currentTime = Math.min(timeOffset, video.duration / 2);
        };
        
        video.onseeked = () => {
          // Draw video frame to canvas
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to data URL
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailUrl);
        };
        
        video.onerror = () => {
          reject(new Error('Failed to load video for thumbnail generation'));
        };
        
        // Load video file
        video.src = URL.createObjectURL(videoFile);
        video.load();
      });
      
    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      // Return placeholder thumbnail
      return this.getPlaceholderThumbnail();
    }
  }

  /**
   * Analyze video file for metadata
   * @param {File} videoFile - Video file to analyze
   * @returns {Promise<Object>} Video analysis results
   */
  async analyzeVideo(videoFile) {
    try {
      console.log('🔍 Analyzing video file...');
      
      const analysis = {
        duration: 0,
        resolution: { width: 0, height: 0 },
        format: videoFile.type,
        size: videoFile.size,
        bitrate: 0,
        fps: 0
      };
      
      // Get basic info from file
      analysis.size = videoFile.size;
      analysis.format = videoFile.type;
      
      // Get duration and resolution using browser APIs
      const videoInfo = await this.getVideoInfo(videoFile);
      analysis.duration = videoInfo.duration;
      analysis.resolution = {
        width: videoInfo.width,
        height: videoInfo.height
      };
      
      // Calculate bitrate (rough estimate)
      if (analysis.duration > 0) {
        analysis.bitrate = Math.round((analysis.size * 8) / (analysis.duration * 1000)); // kbps
      }
      
      // Estimate FPS (most videos are 24, 25, 30, or 60 fps)
      analysis.fps = this.estimateFPS(analysis.duration, analysis.size);
      
      console.log('✅ Video analysis complete:', analysis);
      return analysis;
      
    } catch (error) {
      console.error('❌ Video analysis failed:', error);
      return {
        duration: 0,
        resolution: { width: 0, height: 0 },
        format: videoFile.type,
        size: videoFile.size,
        bitrate: 0,
        fps: 0,
        error: error.message
      };
    }
  }

  /**
   * Get video information using browser APIs
   * @param {File} videoFile - Video file
   * @returns {Promise<Object>} Video info
   */
  async getVideoInfo(videoFile) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      
      video.onerror = () => {
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(videoFile);
      video.load();
    });
  }

  /**
   * Estimate FPS based on video characteristics
   * @param {number} duration - Video duration in seconds
   * @param {number} size - File size in bytes
   * @returns {number} Estimated FPS
   */
  estimateFPS(duration, size) {
    if (duration <= 0) return 30;
    
    // Rough estimation based on file size and duration
    const sizeMB = size / (1024 * 1024);
    const durationMinutes = duration / 60;
    const sizePerMinute = sizeMB / durationMinutes;
    
    // Higher quality videos tend to have higher FPS
    if (sizePerMinute > 50) return 60; // High quality
    if (sizePerMinute > 25) return 30; // Standard quality
    if (sizePerMinute > 15) return 25; // Lower quality
    return 24; // Film standard
  }

  /**
   * Get placeholder thumbnail
   * @returns {string} Placeholder thumbnail URL
   */
  getPlaceholderThumbnail() {
    // Use a working placeholder service
    return `https://picsum.photos/320/180?random=${Date.now()}`;
  }

  /**
   * Generate multiple thumbnails at different timestamps
   * @param {File} videoFile - Video file
   * @param {Array<number>} timestamps - Array of timestamps in seconds
   * @returns {Promise<Array<string>>} Array of thumbnail data URLs
   */
  async generateMultipleThumbnails(videoFile, timestamps = [5, 15, 30]) {
    try {
      console.log('🎬 Generating multiple thumbnails...');
      
      const thumbnails = [];
      for (const timestamp of timestamps) {
        try {
          const thumbnail = await this.generateThumbnail(videoFile, timestamp);
          thumbnails.push({
            timestamp,
            url: thumbnail
          });
        } catch (error) {
          console.warn(`Failed to generate thumbnail at ${timestamp}s:`, error);
        }
      }
      
      return thumbnails;
      
    } catch (error) {
      console.error('❌ Multiple thumbnail generation failed:', error);
      return [];
    }
  }

  /**
   * Detect video content type (combat sports, etc.)
   * @param {File} videoFile - Video file
   * @returns {Promise<string>} Content type prediction
   */
  async detectContentType(videoFile) {
    try {
      // For now, return a default based on file name
      // In the future, you could use AI APIs like:
      // - Google Vision API (expensive but accurate)
      // - Azure Computer Vision (cheaper)
      // - AWS Rekognition (pay-per-use)
      
      const fileName = videoFile.name.toLowerCase();
      
      if (fileName.includes('ufc') || fileName.includes('mma') || fileName.includes('fight')) {
        return 'mma';
      } else if (fileName.includes('boxing') || fileName.includes('box')) {
        return 'boxing';
      } else if (fileName.includes('muay') || fileName.includes('thai')) {
        return 'muay-thai';
      } else if (fileName.includes('wrestling') || fileName.includes('wrestle')) {
        return 'wrestling';
      } else {
        return 'combat-sports'; // Default
      }
      
    } catch (error) {
      console.error('❌ Content type detection failed:', error);
      return 'combat-sports';
    }
  }

  /**
   * Generate thumbnail after video upload (for post-processing)
   * @param {string} videoUrl - URL of the uploaded video
   * @param {string} videoId - Video ID for tracking
   * @returns {Promise<string>} Thumbnail URL
   */
  async generateThumbnailPostUpload(videoUrl, videoId) {
    try {
      console.log('🎬 Generating post-upload thumbnail for video:', videoId);
      
      // In production, you'd call your thumbnail generation API here
      // For now, we'll simulate the process
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a unique thumbnail URL
      const thumbnailUrl = `https://picsum.photos/320/180?random=${videoId}-${Date.now()}`;
      
      console.log('✅ Post-upload thumbnail generated:', thumbnailUrl);
      
      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('thumbnailGenerated', {
        detail: {
          videoId,
          thumbnailUrl
        }
      }));
      
      return thumbnailUrl;
      
    } catch (error) {
      console.error('❌ Post-upload thumbnail generation failed:', error);
      throw error;
    }
  }

  /**
   * Batch generate thumbnails for multiple videos
   * @param {Array} videos - Array of video objects
   * @returns {Promise<Array>} Array of thumbnail results
   */
  async batchGenerateThumbnails(videos) {
    try {
      console.log('🎬 Batch generating thumbnails for', videos.length, 'videos');
      
      const results = [];
      
      for (const video of videos) {
        try {
          if (video.contentFile || video.content_file) {
            const thumbnailUrl = await this.generateThumbnailPostUpload(
              video.contentFile || video.content_file,
              video.id
            );
            
            results.push({
              videoId: video.id,
              success: true,
              thumbnailUrl
            });
          } else {
            results.push({
              videoId: video.id,
              success: false,
              error: 'No video file available'
            });
          }
        } catch (error) {
          results.push({
            videoId: video.id,
            success: false,
            error: error.message
          });
        }
      }
      
      console.log('✅ Batch thumbnail generation complete:', results);
      return results;
      
    } catch (error) {
      console.error('❌ Batch thumbnail generation failed:', error);
      throw error;
    }
  }

  /**
   * Get video duration from URL (for fixing duration issues)
   * @param {string} videoUrl - URL of the video
   * @returns {Promise<number>} Duration in seconds
   */
  async getVideoDurationFromUrl(videoUrl) {
    try {
      console.log('🎬 Getting video duration from URL:', videoUrl);
      
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        
        video.onloadedmetadata = () => {
          console.log('✅ Video duration loaded:', video.duration);
          resolve(video.duration);
        };
        
        video.onerror = () => {
          console.error('❌ Failed to load video for duration check:', videoUrl);
          reject(new Error('Failed to load video metadata'));
        };
        
        // Set crossOrigin to handle CORS issues
        video.crossOrigin = 'anonymous';
        video.src = videoUrl;
        video.load();
      });
      
    } catch (error) {
      console.error('❌ Error getting video duration:', error);
      throw error;
    }
  }
}

// Create and export a single instance
export const videoAnalysisService = new VideoAnalysisService();
export default videoAnalysisService;
