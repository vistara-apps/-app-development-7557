import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { mockCombatVideos, featuredContent, trendingContent, freeContent, premiumContent } from '../data/mockContent';
import { COMBAT_CATEGORIES } from '../config/features';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { livepeerService } from '../services/livepeer';

const ContentContext = createContext();

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export const ContentProvider = ({ children }) => {
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();
  const [featuredContent, setFeaturedContent] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load content from Livepeer
    const loadContent = async () => {
      setLoading(true);
      
      try {
        // Try to load from Livepeer first, fallback to mock data
        let availableContent = await livepeerService.getCombatVideos();
        
        // If Livepeer fails, use mock data
        if (!availableContent || availableContent.length === 0) {
          availableContent = mockCombatVideos;
        }
        
        const stealthMode = isFeatureEnabled('STEALTH_MODE');
        if (stealthMode) {
          // In stealth mode, show all content as free
          availableContent = availableContent.map(video => ({
            ...video,
            isPremium: false
          }));
        }
        
        setFeaturedContent(availableContent.slice(0, 6));
        
        if (user) {
          // Generate personalized recommendations based on user preferences
          const userRecommendations = availableContent.filter(content => 
            user.subscriptionStatus === 'premium' || !content.isPremium
          ).slice(6);
          setRecommendations(userRecommendations);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading content:', error);
        // Fallback to mock data
        let availableContent = mockCombatVideos;
        const stealthMode = isFeatureEnabled('STEALTH_MODE');
        if (stealthMode) {
          availableContent = availableContent.map(video => ({
            ...video,
            isPremium: false
          }));
        }
        
        setFeaturedContent(availableContent.slice(0, 6));
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 5000);

    loadContent();

    return () => clearTimeout(timeoutId);
  }, [user]); // Simplified dependency array to prevent infinite re-renders

  const searchContent = (query, filters = {}) => {
    let content = mockCombatVideos;
    
    // Apply stealth mode filtering
    if (isFeatureEnabled('STEALTH_MODE')) {
      content = content.map(video => ({ ...video, isPremium: false }));
    }
    
    return content.filter(video => {
      const matchesQuery = !query || 
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.description.toLowerCase().includes(query.toLowerCase()) ||
        video.fighters?.some(fighter => fighter.toLowerCase().includes(query.toLowerCase())) ||
        video.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !filters.category || filters.category === 'all' || video.category === filters.category;
      const matchesType = !filters.type || video.type === filters.type;
      const matchesPremium = filters.premium === undefined || video.isPremium === filters.premium;
      const matchesOrganization = !filters.organization || video.organization === filters.organization;
      
      return matchesQuery && matchesCategory && matchesType && matchesPremium && matchesOrganization;
    });
  };

  const getContentById = (id) => {
    let video = mockCombatVideos.find(content => content.id === id);
    
    // Apply stealth mode filtering
    if (video && isFeatureEnabled('STEALTH_MODE')) {
      video = { ...video, isPremium: false };
    }
    
    return video;
  };

  const getContentByCategory = (category) => {
    let content = mockCombatVideos.filter(video => 
      category === 'all' || video.category === category
    );
    
    // Apply stealth mode filtering
    if (isFeatureEnabled('STEALTH_MODE')) {
      content = content.map(video => ({ ...video, isPremium: false }));
    }
    
    return content;
  };

  const getTrendingContent = () => {
    let content = trendingContent;
    
    // Apply stealth mode filtering
    if (isFeatureEnabled('STEALTH_MODE')) {
      content = content.map(video => ({ ...video, isPremium: false }));
    }
    
    return content;
  };

  const getFreeContent = () => {
    return isFeatureEnabled('STEALTH_MODE') ? mockCombatVideos : freeContent;
  };

  const getPremiumContent = () => {
    return isFeatureEnabled('STEALTH_MODE') ? [] : premiumContent;
  };

  const getCategories = () => {
    return COMBAT_CATEGORIES;
  };

  const getOrganizations = () => {
    const orgs = [...new Set(mockCombatVideos.map(video => video.organization))];
    return orgs.sort();
  };

  const getPopularFighters = () => {
    const fighters = mockCombatVideos.flatMap(video => video.fighters || []);
    const fighterCounts = fighters.reduce((acc, fighter) => {
      acc[fighter] = (acc[fighter] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(fighterCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([fighter]) => fighter);
  };

  const value = {
    featuredContent,
    recommendations,
    loading,
    searchContent,
    getContentById,
    getContentByCategory,
    getTrendingContent,
    getFreeContent,
    getPremiumContent,
    getCategories,
    getOrganizations,
    getPopularFighters,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    allContent: mockCombatVideos
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

