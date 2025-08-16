import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import videoManagementService from '../services/videoManagement';

const ContentContext = createContext();

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export const ContentProvider = ({ children }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isFeatureEnabled } = useFeatureFlags();

  // Debug environment variables
  console.log('🔑 ContentContext: Environment variables check:');
  console.log('🔑 ContentContext: VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('🔑 ContentContext: VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...` : '❌ Missing');
  console.log('🔑 ContentContext: All env vars:', import.meta.env);

  // Test video management service
  console.log('🧪 ContentContext: Testing video management service...');
  try {
    const testResult = videoManagementService.testService();
    console.log('🧪 ContentContext: Service test result:', testResult);
  } catch (error) {
    console.error('❌ ContentContext: Service test failed:', error);
  }

  // Load content from database
  useEffect(() => {
    console.log('🚀 ContentContext: useEffect triggered, calling loadContent...');
    loadContent();
  }, []);

  // Listen for new video uploads
  useEffect(() => {
    const handleVideoAdded = (event) => {
      const { video } = event.detail;
      console.log('🎬 New video added to content context:', video);
      console.log('📊 Current content count before adding:', content.length);
      
      // Add the video to the content state
      setContent(prevContent => {
        const newContent = [...prevContent, video];
        console.log('📊 Content updated, new count:', newContent.length);
        return newContent;
      });
    };

    const handleThumbnailGenerated = (event) => {
      const { videoId, thumbnailUrl } = event.detail;
      console.log('🖼️ Thumbnail generated for video:', videoId, thumbnailUrl);
      
      // Update the video with new thumbnail
      setContent(prevContent => 
        prevContent.map(video => 
          video.id === videoId 
            ? { ...video, previewThumbnail: thumbnailUrl, thumbnail: thumbnailUrl }
            : video
        )
      );
    };

    const handleVideoDurationFixed = (event) => {
      const { videoId, duration } = event.detail;
      console.log('⏱️ Duration fixed for video:', videoId, duration);
      
      // Update the video with new duration
      setContent(prevContent => 
        prevContent.map(video => 
          video.id === videoId 
            ? { ...video, duration }
            : video
        )
      );
    };

    window.addEventListener('videoAdded', handleVideoAdded);
    window.addEventListener('thumbnailGenerated', handleThumbnailGenerated);
    window.addEventListener('videoDurationFixed', handleVideoDurationFixed);
    
    return () => {
      window.removeEventListener('videoAdded', handleVideoAdded);
      window.removeEventListener('thumbnailGenerated', handleThumbnailGenerated);
      window.removeEventListener('videoDurationFixed', handleVideoDurationFixed);
    };
  }, []); // No dependencies to prevent infinite loops

  const refreshContent = async () => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing content from database...');
      
      // Refresh videos from the service
      await videoManagementService.refreshVideos();
      
      // Get the updated videos
      const updatedVideos = videoManagementService.getAllVideos();
      setContent(updatedVideos);
      
      console.log('✅ Content refreshed, new count:', updatedVideos.length);
      
    } catch (error) {
      console.error('❌ Error refreshing content:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📚 ContentContext: Starting to load content...');
      console.log('📚 ContentContext: Video management service:', videoManagementService);
      
      // Use the video management service to load videos
      console.log('📚 ContentContext: Calling videoManagementService.loadVideos()...');
      await videoManagementService.loadVideos();
      
      // Get the loaded videos from the service
      const loadedVideos = videoManagementService.videos;
      console.log('📚 ContentContext: Videos loaded from service:', loadedVideos);
      console.log('📚 ContentContext: Video count:', loadedVideos.length);
      
      // If no videos loaded from database, show a fallback message
      if (loadedVideos.length === 0) {
        console.log('📚 ContentContext: No videos loaded, checking for fallback...');
        // Check if there's an error in the service
        if (videoManagementService.error) {
          console.log('📚 ContentContext: Service has error:', videoManagementService.error);
          setError(`Database error: ${videoManagementService.error}`);
        } else {
          console.log('📚 ContentContext: No videos in database, showing empty state');
        }
      }
      
      setContent(loadedVideos);
      
      console.log('✅ ContentContext: Content loaded successfully, state updated');
      
    } catch (error) {
      console.error('❌ ContentContext: Error loading content:', error);
      setError(error.message);
      setContent([]);
    } finally {
      setLoading(false);
      console.log('📚 ContentContext: Loading finished, loading state:', false);
    }
  };

  const getContentByCategory = (category) => {
    if (!content || content.length === 0) return [];
    
    return content.filter(video => video.category === category);
  };

  const getContentByType = (type) => {
    if (!content || content.length === 0) return [];
    
    return content.filter(video => video.type === type);
  };

  const getContentByOrganization = (organization) => {
    if (!content || content.length === 0) return [];
    
    return content.filter(video => video.organization === organization);
  };

  const getContentByFighter = (fighterName) => {
    if (!content || content.length === 0) return [];
    
    return content.filter(video => 
      video.fighters && video.fighters.some(fighter => 
        fighter.toLowerCase().includes(fighterName.toLowerCase())
      )
    );
  };

  const getContentById = (id) => {
    if (!content || content.length === 0) return null;
    
    return content.find(video => video.id === id);
  };

  const searchContent = (query) => {
    if (!content || content.length === 0) return [];
    
    const searchTerm = query.toLowerCase();
    return content.filter(video =>
      video.title?.toLowerCase().includes(searchTerm) ||
      video.description?.toLowerCase().includes(searchTerm) ||
      video.fighters?.some(fighter => fighter.toLowerCase().includes(searchTerm)) ||
      video.organization?.toLowerCase().includes(searchTerm) ||
      video.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  };

  const getFeaturedContent = () => {
    if (!content || content.length === 0) return [];
    
    // Return featured content based on views, rating, featured flag, or recent uploads
    return content.filter(video => 
      video.featured || 
      video.views > 1000 || 
      (video.uploaded_at && new Date(video.uploaded_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
    );
  };

  const getTrendingContent = () => {
    if (!content || content.length === 0) return [];
    
    // Return trending content based on recent views, uploads, or recent activity
    return content.filter(video => 
      video.views > 500 || 
      (video.uploaded_at && new Date(video.uploaded_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
    ).sort((a, b) => {
      // Sort by views first, then by upload date
      if (a.views !== b.views) {
        return b.views - a.views;
      }
      // If views are equal, sort by upload date (newest first)
      return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
    });
  };

  const getFreeContent = () => {
    if (!content || content.length === 0) return [];
    
    return content.filter(video => !video.isPremium);
  };

  const getPremiumContent = () => {
    if (!content || content.length === 0) return [];
    
    return content.filter(video => video.isPremium);
  };

  const getAvailableContent = () => {
    if (!content || content.length === 0) return [];
    
    // Return content based on feature flags
    return isFeatureEnabled('STEALTH_MODE') ? content : getFreeContent();
  };

  const getOrganizations = () => {
    if (!content || content.length === 0) return [];
    
    const orgs = [...new Set(content.map(video => video.organization))];
    return orgs.filter(org => org && org.trim() !== '');
  };

  const getFighters = () => {
    if (!content || content.length === 0) return [];
    
    const fighters = content.flatMap(video => video.fighters || []);
    return [...new Set(fighters)].filter(fighter => fighter && fighter.trim() !== '');
  };

  const getCategories = () => {
    if (!content || content.length === 0) return [];
    
    // Get unique categories from content
    const uniqueCategories = [...new Set(content.map(video => video.category))];
    
    // Map to the format expected by CategoryFilter
    return uniqueCategories
      .filter(cat => cat && cat.trim() !== '')
      .map(category => ({
        id: category,
        name: category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: getCategoryIcon(category)
      }));
  };

  // Helper function to get category icons
  const getCategoryIcon = (category) => {
    const iconMap = {
      'mma': '🥊',
      'boxing': '🥊',
      'wrestling': '🤼',
      'jiu-jitsu': '🥋',
      'kickboxing': '🥊',
      'karate': '🥋',
      'taekwondo': '🥋',
      'muay-thai': '🥊',
      'combat-sports': '⚔️',
      'tutorials': '📚',
      'highlights': '🔥',
      'default': '🥊'
    };
    
    return iconMap[category] || iconMap.default;
  };

  const addContent = (newContent) => {
    setContent(prev => [...prev, newContent]);
  };

  const updateContent = (id, updates) => {
    setContent(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeContent = (id) => {
    setContent(prev => prev.filter(item => item.id !== id));
  };

  const updateVideoThumbnail = (videoId, thumbnailUrl) => {
    setContent(prev => 
      prev.map(video => 
        video.id === videoId 
          ? { ...video, previewThumbnail: thumbnailUrl, thumbnail: thumbnailUrl }
          : video
      )
    );
  };

  const value = {
    content,
    loading,
    error,
    loadContent,
    refreshContent,
    getContentByCategory,
    getContentByType,
    getContentByOrganization,
    getContentByFighter,
    getContentById,
    searchContent,
    getFeaturedContent,
    getTrendingContent,
    getFreeContent,
    getPremiumContent,
    getAvailableContent,
    getOrganizations,
    getFighters,
    getCategories,
    addContent,
    updateContent,
    removeContent,
    updateVideoThumbnail,
    allContent: content
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

