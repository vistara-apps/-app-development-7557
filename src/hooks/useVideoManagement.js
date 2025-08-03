import { useState, useEffect, useCallback, useRef } from 'react';
import { videoAPI, ConflictError } from '../services/videoApi';

export function useVideoManagement() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Real-time subscription cleanup
  const unsubscribeRef = useRef(null);

  // Load videos with filters
  const loadVideos = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await videoAPI.getVideos({
        page: pagination.page,
        limit: pagination.limit,
        ...options,
      });

      setVideos(response.videos);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Create a new video
  const createVideo = useCallback(async (videoData) => {
    setLoading(true);
    setError(null);

    try {
      const newVideo = await videoAPI.createVideo(videoData);
      setVideos(prev => [newVideo, ...prev]);
      return newVideo;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload video file
  const uploadVideo = useCallback(async (videoId, videoFile, thumbnailFile = null, onProgress = null) => {
    setError(null);

    try {
      // Create a progress tracking wrapper if needed
      if (onProgress) {
        onProgress(0);
      }

      const result = await videoAPI.uploadVideo(videoId, videoFile, thumbnailFile);

      if (onProgress) {
        onProgress(100);
      }

      // Update the video in the list
      setVideos(prev => prev.map(video => 
        video.id === videoId ? { ...video, ...result } : video
      ));

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Update video with CRDT conflict resolution
  const updateVideo = useCallback(async (videoId, updateData, retryOnConflict = true) => {
    setError(null);

    try {
      // Get current video state for CRDT
      const currentVideo = videos.find(v => v.id === videoId);
      const vectorClock = currentVideo?.vector_clock;
      const version = currentVideo?.version;

      const result = await videoAPI.updateVideo(videoId, updateData, vectorClock, version);

      // Update the video in the list
      setVideos(prev => prev.map(video => 
        video.id === videoId ? { ...video, ...result } : video
      ));

      return result;
    } catch (err) {
      if (err instanceof ConflictError && retryOnConflict) {
        // Handle CRDT conflict by refreshing and retrying
        try {
          await refreshVideo(videoId);
          // Retry the update with fresh state
          return updateVideo(videoId, updateData, false);
        } catch (retryErr) {
          setError(`Conflict resolution failed: ${retryErr.message}`);
          throw retryErr;
        }
      } else {
        setError(err.message);
        throw err;
      }
    }
  }, [videos]);

  // Delete video
  const deleteVideo = useCallback(async (videoId, hardDelete = false) => {
    setError(null);

    try {
      await videoAPI.deleteVideo(videoId, hardDelete);

      if (hardDelete) {
        // Remove from list completely
        setVideos(prev => prev.filter(video => video.id !== videoId));
      } else {
        // Mark as deleted
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, status: 'deleted', deleted_at: new Date().toISOString() }
            : video
        ));
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Refresh a single video
  const refreshVideo = useCallback(async (videoId) => {
    try {
      const updatedVideo = await videoAPI.getVideo(videoId);
      setVideos(prev => prev.map(video => 
        video.id === videoId ? updatedVideo : video
      ));
      return updatedVideo;
    } catch (err) {
      console.error('Failed to refresh video:', err);
      throw err;
    }
  }, []);

  // Sync video state with server (CRDT)
  const syncVideo = useCallback(async (videoId) => {
    try {
      const currentVideo = videos.find(v => v.id === videoId);
      if (!currentVideo) return;

      const syncResult = await videoAPI.syncVideo(
        videoId,
        currentVideo.vector_clock,
        currentVideo.version
      );

      if (syncResult.action === 'update_client') {
        // Server has newer state, update local
        setVideos(prev => prev.map(video => 
          video.id === videoId ? syncResult.server_state : video
        ));
      } else if (syncResult.action === 'merged_concurrent') {
        // Conflicts were resolved, update with merged state
        setVideos(prev => prev.map(video => 
          video.id === videoId ? syncResult.merged_video : video
        ));
      }

      return syncResult;
    } catch (err) {
      console.error('Failed to sync video:', err);
      throw err;
    }
  }, [videos]);

  // Set up real-time subscriptions
  const subscribeToChanges = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = videoAPI.subscribeToAllVideoChanges((payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          setVideos(prev => {
            // Avoid duplicates
            if (prev.some(v => v.id === newRecord.id)) return prev;
            return [newRecord, ...prev];
          });
          break;

        case 'UPDATE':
          setVideos(prev => prev.map(video => 
            video.id === newRecord.id ? { ...video, ...newRecord } : video
          ));
          break;

        case 'DELETE':
          setVideos(prev => prev.filter(video => video.id !== oldRecord.id));
          break;

        default:
          break;
      }
    });
  }, []);

  // Pagination controls
  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  // Initialize and cleanup
  useEffect(() => {
    loadVideos();
    subscribeToChanges();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Reload when pagination changes
  useEffect(() => {
    loadVideos();
  }, [pagination.page, pagination.limit]);

  return {
    // State
    videos,
    loading,
    error,
    pagination,

    // Actions
    loadVideos,
    createVideo,
    uploadVideo,
    updateVideo,
    deleteVideo,
    refreshVideo,
    syncVideo,

    // Pagination
    goToPage,
    setPageSize,

    // Utilities
    clearError: () => setError(null),
    subscribeToChanges,
  };
}

// Hook for managing a single video with real-time updates
export function useVideo(videoId) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced', 'syncing', 'conflict'

  const unsubscribeRef = useRef(null);

  // Load video
  const loadVideo = useCallback(async () => {
    if (!videoId) return;

    setLoading(true);
    setError(null);

    try {
      const videoData = await videoAPI.getVideo(videoId);
      setVideo(videoData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  // Update video with CRDT
  const updateVideo = useCallback(async (updateData) => {
    if (!video) return;

    setSyncStatus('syncing');
    setError(null);

    try {
      const result = await videoAPI.updateVideo(
        videoId,
        updateData,
        video.vector_clock,
        video.version
      );

      setVideo(result);
      setSyncStatus('synced');
      return result;
    } catch (err) {
      if (err instanceof ConflictError) {
        setSyncStatus('conflict');
        // Auto-resolve by refreshing
        await loadVideo();
      } else {
        setError(err.message);
        setSyncStatus('synced');
      }
      throw err;
    }
  }, [video, videoId, loadVideo]);

  // Sync with server
  const sync = useCallback(async () => {
    if (!video) return;

    setSyncStatus('syncing');

    try {
      const syncResult = await videoAPI.syncVideo(
        videoId,
        video.vector_clock,
        video.version
      );

      if (syncResult.action !== 'no_changes') {
        const updatedVideo = syncResult.server_state || 
                           syncResult.merged_video || 
                           syncResult.updated_video;
        if (updatedVideo) {
          setVideo(updatedVideo);
        }
      }

      setSyncStatus('synced');
      return syncResult;
    } catch (err) {
      setError(err.message);
      setSyncStatus('synced');
      throw err;
    }
  }, [video, videoId]);

  // Subscribe to real-time changes for this video
  useEffect(() => {
    if (!videoId) return;

    loadVideo();

    unsubscribeRef.current = videoAPI.subscribeToVideoChanges(videoId, (payload) => {
      const { eventType, new: newRecord } = payload;

      if (eventType === 'UPDATE' && newRecord.id === videoId) {
        setVideo(prev => ({ ...prev, ...newRecord }));
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [videoId, loadVideo]);

  return {
    video,
    loading,
    error,
    syncStatus,
    updateVideo,
    sync,
    refresh: loadVideo,
    clearError: () => setError(null),
  };
}
