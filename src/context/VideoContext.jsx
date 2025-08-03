import React, { createContext, useContext, useState, useEffect } from 'react';
import { videoManagementService } from '../services/videoManagement';

const VideoContext = createContext();

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};

export const VideoProvider = ({ children }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  // Admin video management state
  const [adminVideos, setAdminVideos] = useState([]);
  const [videoStats, setVideoStats] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [loading, setLoading] = useState(false);

  // Load admin videos on mount
  useEffect(() => {
    loadAdminVideos();
    
    // Listen for upload progress events
    const handleUploadProgress = (event) => {
      const { videoId, progress } = event.detail;
      setUploadProgress(prev => ({
        ...prev,
        [videoId]: progress
      }));
    };

    window.addEventListener('uploadProgress', handleUploadProgress);
    return () => window.removeEventListener('uploadProgress', handleUploadProgress);
  }, []);

  const openVideoModal = (content) => {
    setCurrentVideo(content);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setCurrentVideo(null);
  };

  // Admin video management functions
  const loadAdminVideos = async () => {
    setLoading(true);
    try {
      await videoManagementService.loadVideos();
      const videos = videoManagementService.getAllVideos();
      const stats = videoManagementService.getVideoStats();
      setAdminVideos(videos);
      setVideoStats(stats);
    } catch (error) {
      console.error('Error loading admin videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addVideo = async (videoData, file) => {
    try {
      const newVideo = await videoManagementService.addVideo(videoData, file);
      await loadAdminVideos(); // Refresh the list
      return newVideo;
    } catch (error) {
      console.error('Error adding video:', error);
      throw error;
    }
  };

  const updateVideo = async (id, updates) => {
    try {
      const updatedVideo = videoManagementService.updateVideo(id, updates);
      await loadAdminVideos(); // Refresh the list
      return updatedVideo;
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  };

  const deleteVideo = async (id) => {
    try {
      const deletedVideo = videoManagementService.deleteVideo(id);
      await loadAdminVideos(); // Refresh the list
      return deletedVideo;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  };

  const searchVideos = (query, filters) => {
    return videoManagementService.searchVideos(query, filters);
  };

  const bulkDeleteVideos = async (videoIds) => {
    try {
      const deletedVideos = videoManagementService.bulkDelete(videoIds);
      await loadAdminVideos(); // Refresh the list
      return deletedVideos;
    } catch (error) {
      console.error('Error bulk deleting videos:', error);
      throw error;
    }
  };

  const bulkUpdateVideoStatus = async (videoIds, status) => {
    try {
      const result = videoManagementService.bulkUpdateStatus(videoIds, status);
      await loadAdminVideos(); // Refresh the list
      return result;
    } catch (error) {
      console.error('Error bulk updating video status:', error);
      throw error;
    }
  };

  const value = {
    // Original video modal functionality
    isVideoModalOpen,
    currentVideo,
    openVideoModal,
    closeVideoModal,
    
    // Admin video management
    adminVideos,
    videoStats,
    uploadProgress,
    loading,
    loadAdminVideos,
    addVideo,
    updateVideo,
    deleteVideo,
    searchVideos,
    bulkDeleteVideos,
    bulkUpdateVideoStatus
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
};
