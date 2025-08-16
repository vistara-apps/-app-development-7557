import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

class VideoAPI {
  constructor() {
    this.baseUrl = `${supabaseUrl}/functions/v1`;
  }

  async getAuthHeaders() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return {
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        'Content-Type': 'application/json',
      };
    } catch (error) {
      // Handle case where auth is not available
      return {
        'Authorization': '',
        'Content-Type': 'application/json',
      };
    }
  }

  async getAuthHeadersForFormData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ? {
        'Authorization': `Bearer ${session.access_token}`,
      } : {};
    } catch (error) {
      // Handle case where auth is not available
      return {};
    }
  }

  // Get all videos with pagination and filters
  async getVideos(options = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      status = 'ready',
      featured
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    });

    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (featured !== undefined) params.append('featured', featured.toString());

    const response = await fetch(`${this.baseUrl}/videos?${params}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.statusText}`);
    }

    return response.json();
  }

  // Get a single video by ID
  async getVideo(videoId) {
    const response = await fetch(`${this.baseUrl}/videos-update/${videoId}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Video not found');
      }
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    return response.json();
  }

  // Create a new video (metadata only)
  async createVideo(videoData) {
    const response = await fetch(`${this.baseUrl}/videos`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(videoData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create video: ${response.statusText}`);
    }

    return response.json();
  }

  // Upload video file
  async uploadVideo(videoId, videoFile, thumbnailFile = null) {
    const formData = new FormData();
    formData.append('videoId', videoId);
    formData.append('video', videoFile);
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    const response = await fetch(`${this.baseUrl}/videos-upload`, {
      method: 'POST',
      headers: await this.getAuthHeadersForFormData(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload video: ${response.statusText}`);
    }

    return response.json();
  }

  // Complete video processing
  async completeVideoProcessing(videoId, processingData) {
    const response = await fetch(`${this.baseUrl}/videos-upload`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        videoId,
        ...processingData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete video processing: ${response.statusText}`);
    }

    return response.json();
  }

  // Update video metadata with CRDT support
  async updateVideo(videoId, updateData, vectorClock = null, version = null) {
    const payload = {
      ...updateData,
    };

    if (vectorClock) {
      payload.vector_clock = vectorClock;
    }

    if (version) {
      payload.version = version;
    }

    const response = await fetch(`${this.baseUrl}/videos-update/${videoId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 409) {
        const errorData = await response.json();
        throw new ConflictError(errorData.error);
      }
      throw new Error(`Failed to update video: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete video (soft delete by default)
  async deleteVideo(videoId, hardDelete = false) {
    const params = hardDelete ? '?hard=true' : '';
    const response = await fetch(`${this.baseUrl}/videos-delete/${videoId}${params}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Video not found');
      }
      throw new Error(`Failed to delete video: ${response.statusText}`);
    }

    return response.json();
  }

  // Sync video state with server (CRDT)
  async syncVideo(videoId, clientVectorClock, clientVersion, operations = []) {
    const response = await fetch(`${this.baseUrl}/sync`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        video_id: videoId,
        client_vector_clock: clientVectorClock,
        client_version: clientVersion,
        operations,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync video: ${response.statusText}`);
    }

    return response.json();
  }

  // Get sync state for a video
  async getSyncState(videoId, since = null) {
    const params = new URLSearchParams({ video_id: videoId });
    if (since) {
      params.append('since', since);
    }

    const response = await fetch(`${this.baseUrl}/sync?${params}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get sync state: ${response.statusText}`);
    }

    return response.json();
  }

  // Subscribe to real-time changes
  subscribeToVideoChanges(videoId, callback) {
    const channel = supabase
      .channel(`video-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${videoId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crdt_operations',
          filter: `video_id=eq.${videoId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Subscribe to all video changes
  subscribeToAllVideoChanges(callback) {
    const channel = supabase
      .channel('all-videos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Get video categories
  async getCategories() {
    const { data, error } = await supabase
      .from('videos')
      .select('category')
      .not('category', 'is', null)
      .not('deleted_at', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))];
    return categories.filter(Boolean);
  }

  // Get video analytics (admin only)
  async getVideoAnalytics(videoId, timeRange = '7d') {
    const { data, error } = await supabase
      .from('video_analytics')
      .select('*')
      .eq('video_id', videoId)
      .gte('created_at', new Date(Date.now() - this.getTimeRangeMs(timeRange)).toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    return data;
  }

  getTimeRangeMs(range) {
    const ranges = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    return ranges[range] || ranges['7d'];
  }
}

// Custom error class for CRDT conflicts
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

export const videoAPI = new VideoAPI();
