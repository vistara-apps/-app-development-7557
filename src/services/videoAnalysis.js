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
   * @param {File} videoFile - Video file to generate thumbnail from
   * @returns {Promise<string>} Thumbnail data URL or fallback URL
   */
  async generateThumbnail(videoFile) {
    try {
      console.log('🖼️ Generating thumbnail for:', videoFile.name);
      
      // Check if we can create object URLs (CSP might block this)
      if (!URL.createObjectURL) {
        console.warn('⚠️ URL.createObjectURL not available, using fallback thumbnail');
        return this._generateThumbnailFromFileName(videoFile.name);
      }

      const videoUrl = URL.createObjectURL(videoFile);
      console.log('🔗 Created video URL for thumbnail:', videoUrl);
      
      try {
        const thumbnailUrl = await this._generateThumbnailFromUrl(videoUrl, videoFile);
        
        // Clean up the blob URL
        URL.revokeObjectURL(videoUrl);
        
        return thumbnailUrl;
      } catch (error) {
        console.warn('⚠️ Thumbnail generation failed, using fallback:', error.message);
        URL.revokeObjectURL(videoUrl);
        return this._generateThumbnailFromFileName(videoFile.name);
      }
      
    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      return this._generateThumbnailFromFileName(videoFile.name);
    }
  }

  /**
   * Analyze video file and extract metadata
   * @param {File} file - Video file to analyze
   * @returns {Promise<Object>} Video analysis results
   */
  async analyzeVideo(file) {
    try {
      console.log('🎬 Analyzing video file:', file.name);
      
      // Check if we can create object URLs (CSP might block this)
      if (!URL.createObjectURL) {
        console.warn('⚠️ URL.createObjectURL not available, using fallback analysis');
        return this._fallbackVideoAnalysis(file);
      }

      const videoUrl = URL.createObjectURL(file);
      console.log('🔗 Created video URL:', videoUrl);
      
      try {
        const analysis = await this._analyzeVideoFromUrl(videoUrl, file);
        
        // Clean up the blob URL to prevent memory leaks
        URL.revokeObjectURL(videoUrl);
        
        return analysis;
      } catch (error) {
        console.warn('⚠️ Video analysis failed, using fallback:', error.message);
        URL.revokeObjectURL(videoUrl);
        return this._fallbackVideoAnalysis(file);
      }
      
    } catch (error) {
      console.error('❌ Video analysis failed:', error);
      return this._fallbackVideoAnalysis(file);
    }
  }

  /**
   * Fallback video analysis when blob URLs are blocked by CSP
   * @param {File} file - Video file to analyze
   * @returns {Object} Basic video analysis results
   */
  _fallbackVideoAnalysis(file) {
    console.log('🔄 Using fallback video analysis for:', file.name);
    
    // Extract basic info from file object
    const fileSize = file.size;
    const fileName = file.name;
    const fileType = file.type;
    
    // Estimate duration based on file size and type (rough approximation)
    let estimatedDuration = '0:00';
    if (fileSize > 0) {
      // Rough estimate: 1MB ≈ 1 minute for compressed video
      const estimatedSeconds = Math.floor(fileSize / (1024 * 1024) * 60);
      estimatedDuration = this._formatDuration(estimatedSeconds);
    }
    
    // Generate thumbnail from file name hash
    const thumbnailUrl = this._generateThumbnailFromFileName(fileName);
    
    return {
      duration: estimatedDuration,
      fileSize: fileSize,
      fileName: fileName,
      fileType: fileType,
      resolution: 'Unknown',
      bitrate: 'Unknown',
      fps: 'Unknown',
      thumbnailUrl: thumbnailUrl,
      analysisMethod: 'fallback'
    };
  }

  /**
   * Generate thumbnail URL from filename (CSP-safe)
   * @param {string} fileName - Name of the video file
   * @returns {string} Thumbnail URL
   */
  _generateThumbnailFromFileName(fileName) {
    // Create a deterministic thumbnail based on filename
    const hash = this._simpleHash(fileName);
    const colors = [
      'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
      'FF8000', '8000FF', '00FF80', 'FF0080', '80FF00', '0080FF'
    ];
    const color = colors[hash % colors.length];
    
    return `https://picsum.photos/320/180?random=${hash}&blur=2`;
  }

  /**
   * Simple hash function for deterministic results
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate thumbnail from video URL (original method)
   * @param {string} videoUrl - URL of the video
   * @param {File} videoFile - Original video file
   * @returns {Promise<string>} Thumbnail data URL
   */
  async _generateThumbnailFromUrl(videoUrl, videoFile) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let thumbnailTimeout;
      
      const cleanup = () => {
        if (thumbnailTimeout) clearTimeout(thumbnailTimeout);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        video.removeEventListener('canplay', handleCanPlay);
        video.src = '';
        video.load();
      };
      
      const handleLoadedData = () => {
        try {
          console.log('✅ Video loaded for thumbnail generation');
          
          // Set canvas dimensions
          canvas.width = 320;
          canvas.height = 180;
          
          // Generate thumbnail
          ctx.drawImage(video, 0, 0, 320, 180);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          console.log('✅ Thumbnail generated successfully');
          cleanup();
          resolve(thumbnailUrl);
          
        } catch (error) {
          console.error('❌ Error generating thumbnail:', error);
          cleanup();
          reject(error);
        }
      };
      
      const handleError = (error) => {
        console.error('❌ Video thumbnail error:', error);
        cleanup();
        reject(new Error('Failed to load video for thumbnail generation'));
      };
      
      const handleCanPlay = () => {
        // Fallback if loadeddata doesn't fire
        if (video.readyState >= 2) {
          handleLoadedData();
        }
      };
      
      // Set timeout for thumbnail generation
      thumbnailTimeout = setTimeout(() => {
        console.warn('⚠️ Thumbnail generation timeout, using fallback');
        cleanup();
        reject(new Error('Thumbnail generation timeout'));
      }, 8000); // 8 second timeout
      
      // Set up event listeners
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.addEventListener('canplay', handleCanPlay);
      
      // Set video source
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.src = videoUrl;
      video.load();
    });
  }

  /**
   * Analyze video from URL (original method)
   * @param {string} videoUrl - URL of the video
   * @param {File} file - Original file object
   * @returns {Promise<Object>} Video analysis results
   */
  async _analyzeVideoFromUrl(videoUrl, file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let analysisTimeout;
      
      const cleanup = () => {
        if (analysisTimeout) clearTimeout(analysisTimeout);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('error', handleError);
        video.removeEventListener('canplay', handleCanPlay);
        video.src = '';
        video.load();
      };
      
      const handleLoadedMetadata = () => {
        try {
          console.log('✅ Video metadata loaded successfully');
          
          // Set canvas dimensions
          canvas.width = video.videoWidth || 320;
          canvas.height = video.videoHeight || 180;
          
          // Generate thumbnail
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Calculate bitrate (rough estimate)
          const bitrate = file.size > 0 && video.duration > 0 
            ? Math.round((file.size * 8) / (video.duration * 1024 * 1024))
            : 'Unknown';
          
          const analysis = {
            duration: this._formatDuration(video.duration),
            fileSize: file.size,
            fileName: file.name,
            fileType: file.type,
            resolution: `${video.videoWidth || 'Unknown'}x${video.videoHeight || 'Unknown'}`,
            bitrate: bitrate !== 'Unknown' ? `${bitrate} Mbps` : 'Unknown',
            fps: 'Unknown', // HTML5 video doesn't provide FPS
            thumbnailUrl: thumbnailUrl,
            analysisMethod: 'full'
          };
          
          console.log('✅ Video analysis complete:', analysis);
          cleanup();
          resolve(analysis);
          
        } catch (error) {
          console.error('❌ Error during video analysis:', error);
          cleanup();
          reject(error);
        }
      };
      
      const handleError = (error) => {
        console.error('❌ Video analysis error:', error);
        cleanup();
        reject(new Error('Failed to load video metadata'));
      };
      
      const handleCanPlay = () => {
        // Fallback if loadedmetadata doesn't fire
        if (video.readyState >= 1) {
          handleLoadedMetadata();
        }
      };
      
      // Set timeout for analysis
      analysisTimeout = setTimeout(() => {
        console.warn('⚠️ Video analysis timeout, using fallback');
        cleanup();
        reject(new Error('Video analysis timeout'));
      }, 10000); // 10 second timeout
      
      // Set up event listeners
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('error', handleError);
      video.addEventListener('canplay', handleCanPlay);
      
      // Set video source
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.src = videoUrl;
      video.load();
    });
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
   * Generate thumbnail after upload (CSP-safe)
   * @param {string} videoUrl - URL of the uploaded video
   * @param {string} videoId - ID of the video
   * @returns {Promise<string>} Thumbnail URL
   */
  async generateThumbnailPostUpload(videoUrl, videoId) {
    try {
      console.log('🖼️ Generating post-upload thumbnail for video:', videoId);
      
      // Check if this is a blob URL that might be blocked by CSP
      if (videoUrl.startsWith('blob:')) {
        console.warn('⚠️ Blob URL detected, CSP might block this. Using fallback thumbnail.');
        return this._generateThumbnailFromVideoId(videoId);
      }
      
      // Try to generate thumbnail from the actual video URL
      try {
        const thumbnailUrl = await this._generateThumbnailFromUrl(videoUrl, null);
        console.log('✅ Post-upload thumbnail generated successfully');
        return thumbnailUrl;
      } catch (error) {
        console.warn('⚠️ Post-upload thumbnail generation failed, using fallback:', error.message);
        return this._generateThumbnailFromVideoId(videoId);
      }
      
    } catch (error) {
      console.error('❌ Error in post-upload thumbnail generation:', error);
      return this._generateThumbnailFromVideoId(videoId);
    }
  }

  /**
   * Generate fallback thumbnail from video ID (CSP-safe)
   * @param {string} videoId - ID of the video
   * @returns {string} Fallback thumbnail URL
   */
  _generateThumbnailFromVideoId(videoId) {
    // Create a deterministic thumbnail based on video ID
    const hash = this._simpleHash(videoId);
    return `https://picsum.photos/320/180?random=${hash}&blur=1`;
  }

  /**
   * Batch generate thumbnails for multiple videos (CSP-safe)
   * @param {Array} videos - Array of video objects
   * @returns {Promise<void>}
   */
  async batchGenerateThumbnails(videos) {
    try {
      console.log('🖼️ Batch generating thumbnails for', videos.length, 'videos');
      
      for (const video of videos) {
        try {
          if (video.contentFile || video.content_file) {
            const videoUrl = video.contentFile || video.content_file;
            const thumbnailUrl = await this.generateThumbnailPostUpload(videoUrl, video.id);
            
            // Dispatch event for UI update
            window.dispatchEvent(new CustomEvent('thumbnailGenerated', {
              detail: {
                videoId: video.id,
                thumbnailUrl: thumbnailUrl
              }
            }));
            
            console.log('✅ Thumbnail generated for video:', video.title);
          }
        } catch (error) {
          console.error('❌ Failed to generate thumbnail for video:', video.title, error);
        }
      }
      
      console.log('✅ Batch thumbnail generation complete');
      
    } catch (error) {
      console.error('❌ Error in batch thumbnail generation:', error);
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
      
      // Check if this is a blob URL that might be blocked by CSP
      if (videoUrl.startsWith('blob:')) {
        console.warn('⚠️ Blob URL detected, CSP might block this. Using fallback duration.');
        return 0; // Return 0 duration for blob URLs
      }
      
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        let durationTimeout;
        
        const cleanup = () => {
          if (durationTimeout) clearTimeout(durationTimeout);
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('error', handleError);
          video.removeEventListener('canplay', handleCanPlay);
          video.src = '';
          video.load();
        };
        
        const handleLoadedMetadata = () => {
          console.log('✅ Video duration loaded:', video.duration);
          cleanup();
          resolve(video.duration);
        };
        
        const handleError = () => {
          console.error('❌ Failed to load video for duration check:', videoUrl);
          cleanup();
          reject(new Error('Failed to load video metadata'));
        };
        
        const handleCanPlay = () => {
          // Fallback if loadedmetadata doesn't fire
          if (video.readyState >= 1 && video.duration > 0) {
            console.log('✅ Video duration loaded via canplay:', video.duration);
            cleanup();
            resolve(video.duration);
          }
        };
        
        // Set timeout for duration check
        durationTimeout = setTimeout(() => {
          console.warn('⚠️ Duration check timeout, using fallback');
          cleanup();
          resolve(0); // Return 0 duration on timeout
        }, 5000); // 5 second timeout
        
        // Set crossOrigin to handle CORS issues
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        video.src = videoUrl;
        video.load();
      });
      
    } catch (error) {
      console.error('❌ Error getting video duration:', error);
      return 0; // Return 0 duration on error
    }
  }
}

// Create and export a single instance
export const videoAnalysisService = new VideoAnalysisService();
export default videoAnalysisService;


