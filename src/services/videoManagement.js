// Video Management Service
// Handles all video CRUD operations for admin dashboard

import { livepeerService } from './livepeer';

class VideoManagementService {
  constructor() {
    this.videos = [];
    this.loadVideos();
  }

  // Load videos from storage/API
  async loadVideos() {
    try {
      // Try to load from localStorage first
      const storedVideos = localStorage.getItem('admin_videos');
      if (storedVideos) {
        this.videos = JSON.parse(storedVideos);
      }
      
      // Also load from Livepeer service
      const livepeerVideos = await livepeerService.getCombatVideos();
      if (livepeerVideos && livepeerVideos.length > 0) {
        // Merge with stored videos, avoiding duplicates
        const existingIds = this.videos.map(v => v.id);
        const newVideos = livepeerVideos.filter(v => !existingIds.includes(v.id));
        this.videos = [...this.videos, ...newVideos];
        this.saveVideos();
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  }

  // Save videos to localStorage
  saveVideos() {
    try {
      localStorage.setItem('admin_videos', JSON.stringify(this.videos));
    } catch (error) {
      console.error('Error saving videos:', error);
    }
  }

  // Get all videos
  getAllVideos() {
    return this.videos;
  }

  // Get video by ID
  getVideoById(id) {
    return this.videos.find(video => video.id === id);
  }

  // Add new video
  async addVideo(videoData, file = null) {
    try {
      const newVideo = {
        id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: videoData.title || 'Untitled Video',
        description: videoData.description || '',
        type: videoData.type || 'highlight',
        category: videoData.category || 'mma',
        duration: videoData.duration || '0:00',
        previewThumbnail: videoData.thumbnail || 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=450&fit=crop',
        contentFile: videoData.contentFile || '',
        isPremium: videoData.isPremium || false,
        views: 0,
        rating: 0,
        uploadDate: new Date().toISOString().split('T')[0],
        fighters: videoData.fighters || [],
        event: videoData.event || '',
        organization: videoData.organization || '',
        weightClass: videoData.weightClass || '',
        tags: videoData.tags || [],
        status: 'processing',
        uploadedBy: videoData.uploadedBy || 'admin',
        fileSize: file ? file.size : 0,
        fileName: file ? file.name : ''
      };

      // If file is provided, handle upload
      if (file) {
        try {
          // Simulate file upload process
          newVideo.status = 'uploading';
          this.videos.push(newVideo);
          this.saveVideos();

          // Simulate upload progress
          await this.simulateUpload(newVideo.id, file);
          
          // Update status to processing
          const videoIndex = this.videos.findIndex(v => v.id === newVideo.id);
          if (videoIndex !== -1) {
            this.videos[videoIndex].status = 'processing';
            this.videos[videoIndex].contentFile = URL.createObjectURL(file);
            this.saveVideos();
          }

          // Simulate processing
          setTimeout(() => {
            const videoIndex = this.videos.findIndex(v => v.id === newVideo.id);
            if (videoIndex !== -1) {
              this.videos[videoIndex].status = 'ready';
              this.saveVideos();
            }
          }, 3000);

        } catch (uploadError) {
          newVideo.status = 'failed';
          newVideo.error = uploadError.message;
        }
      }

      this.videos.push(newVideo);
      this.saveVideos();
      return newVideo;
    } catch (error) {
      console.error('Error adding video:', error);
      throw error;
    }
  }

  // Update video
  updateVideo(id, updates) {
    try {
      const videoIndex = this.videos.findIndex(video => video.id === id);
      if (videoIndex === -1) {
        throw new Error('Video not found');
      }

      this.videos[videoIndex] = {
        ...this.videos[videoIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveVideos();
      return this.videos[videoIndex];
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  }

  // Delete video
  deleteVideo(id) {
    try {
      const videoIndex = this.videos.findIndex(video => video.id === id);
      if (videoIndex === -1) {
        throw new Error('Video not found');
      }

      const deletedVideo = this.videos.splice(videoIndex, 1)[0];
      this.saveVideos();
      return deletedVideo;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  // Search videos
  searchVideos(query, filters = {}) {
    let results = this.videos;

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(video =>
        video.title.toLowerCase().includes(searchTerm) ||
        video.description.toLowerCase().includes(searchTerm) ||
        video.fighters.some(fighter => fighter.toLowerCase().includes(searchTerm)) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        video.organization.toLowerCase().includes(searchTerm)
      );
    }

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      results = results.filter(video => video.category === filters.category);
    }

    if (filters.type && filters.type !== 'all') {
      results = results.filter(video => video.type === filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      results = results.filter(video => video.status === filters.status);
    }

    if (filters.isPremium !== undefined) {
      results = results.filter(video => video.isPremium === filters.isPremium);
    }

    if (filters.organization && filters.organization !== 'all') {
      results = results.filter(video => video.organization === filters.organization);
    }

    return results;
  }

  // Get video statistics
  getVideoStats() {
    const stats = {
      total: this.videos.length,
      ready: this.videos.filter(v => v.status === 'ready').length,
      processing: this.videos.filter(v => v.status === 'processing').length,
      uploading: this.videos.filter(v => v.status === 'uploading').length,
      failed: this.videos.filter(v => v.status === 'failed').length,
      premium: this.videos.filter(v => v.isPremium).length,
      free: this.videos.filter(v => !v.isPremium).length,
      totalViews: this.videos.reduce((sum, v) => sum + (v.views || 0), 0),
      totalSize: this.videos.reduce((sum, v) => sum + (v.fileSize || 0), 0)
    };

    // Calculate categories
    stats.categories = {};
    this.videos.forEach(video => {
      stats.categories[video.category] = (stats.categories[video.category] || 0) + 1;
    });

    // Calculate organizations
    stats.organizations = {};
    this.videos.forEach(video => {
      if (video.organization) {
        stats.organizations[video.organization] = (stats.organizations[video.organization] || 0) + 1;
      }
    });

    return stats;
  }

  // Simulate file upload with progress
  async simulateUpload(videoId, file) {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        
        // Emit progress event (in real app, this would be handled by upload service)
        const event = new CustomEvent('uploadProgress', {
          detail: { videoId, progress: Math.round(progress) }
        });
        window.dispatchEvent(event);
      }, 200);
    });
  }

  // Bulk operations
  bulkDelete(videoIds) {
    try {
      const deletedVideos = [];
      videoIds.forEach(id => {
        const videoIndex = this.videos.findIndex(video => video.id === id);
        if (videoIndex !== -1) {
          deletedVideos.push(this.videos.splice(videoIndex, 1)[0]);
        }
      });
      this.saveVideos();
      return deletedVideos;
    } catch (error) {
      console.error('Error in bulk delete:', error);
      throw error;
    }
  }

  bulkUpdateStatus(videoIds, status) {
    try {
      videoIds.forEach(id => {
        const videoIndex = this.videos.findIndex(video => video.id === id);
        if (videoIndex !== -1) {
          this.videos[videoIndex].status = status;
          this.videos[videoIndex].updatedAt = new Date().toISOString();
        }
      });
      this.saveVideos();
      return true;
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const videoManagementService = new VideoManagementService();
export default videoManagementService;
