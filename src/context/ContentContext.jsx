import React, { createContext, useContext, useState, useEffect } from 'react';
import OpenAI from 'openai';

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
  const [featuredContent, setFeaturedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  const openai = new OpenAI({
    apiKey: "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",
    baseURL: "https://openrouter.ai/api/v1",
    dangerouslyAllowBrowser: true,
  });

  // Mock content data
  const mockContent = [
    {
      id: '1',
      title: 'Exclusive Premium Series Episode 1',
      description: 'The beginning of an epic premium series available only to subscribers.',
      type: 'video',
      duration: '24:15',
      previewThumbnail: 'https://images.unsplash.com/photo-1489599510909-e8ed7c9e0f57?w=400&h=225&fit=crop',
      contentFile: 'premium_series_ep1.mp4',
      isPremium: true,
      category: 'series',
      views: 15420,
      rating: 4.8
    },
    {
      id: '2',
      title: 'Action Thriller: Midnight Chase',
      description: 'High-octane action thriller with stunning cinematography.',
      type: 'video',
      duration: '18:32',
      previewThumbnail: 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=400&h=225&fit=crop',
      contentFile: 'midnight_chase.mp4',
      isPremium: false,
      category: 'action',
      views: 8340,
      rating: 4.5
    },
    {
      id: '3',
      title: 'Premium Adult Collection Vol. 2',
      description: 'Curated premium adult entertainment collection.',
      type: 'video',
      duration: '32:48',
      previewThumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=225&fit=crop',
      contentFile: 'premium_collection_v2.mp4',
      isPremium: true,
      category: 'adult',
      views: 22150,
      rating: 4.9
    },
    {
      id: '4',
      title: 'Sci-Fi Adventure: Beyond Stars',
      description: 'Journey into space with this captivating sci-fi adventure.',
      type: 'video',
      duration: '21:07',
      previewThumbnail: 'https://images.unsplash.com/photo-1446776476813-4f9980a9938a?w=400&h=225&fit=crop',
      contentFile: 'beyond_stars.mp4',
      isPremium: false,
      category: 'sci-fi',
      views: 12890,
      rating: 4.6
    },
    {
      id: '5',
      title: 'VIP Exclusive: Behind the Scenes',
      description: 'Exclusive behind-the-scenes content for premium members.',
      type: 'video',
      duration: '15:44',
      previewThumbnail: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=225&fit=crop',
      contentFile: 'vip_behind_scenes.mp4',
      isPremium: true,
      category: 'exclusive',
      views: 5670,
      rating: 4.7
    },
    {
      id: '6',
      title: 'Comedy Special: Laugh Out Loud',
      description: 'Stand-up comedy special that will keep you entertained.',
      type: 'video',
      duration: '28:12',
      previewThumbnail: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&h=225&fit=crop',
      contentFile: 'comedy_special.mp4',
      isPremium: false,
      category: 'comedy',
      views: 19450,
      rating: 4.3
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setContent(mockContent);
      setFeaturedContent(mockContent.slice(0, 3));
      generateRecommendations(mockContent);
      setLoading(false);
    }, 1500);
  }, []);

  const generateRecommendations = async (contentList) => {
    try {
      const response = await openai.chat.completions.create({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: "You are a content recommendation engine. Based on user preferences, suggest 3 content IDs that would be most relevant."
          },
          {
            role: "user",
            content: `Given these content options: ${JSON.stringify(contentList.map(c => ({ id: c.id, title: c.title, category: c.category, rating: c.rating })))} and user preferences: [action, thriller, sci-fi], recommend 3 content IDs in JSON format: {"recommendations": ["id1", "id2", "id3"]}`
          }
        ],
        max_tokens: 150
      });

      const result = JSON.parse(response.choices[0].message.content);
      const recommendedContent = contentList.filter(c => result.recommendations.includes(c.id));
      setRecommendations(recommendedContent);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      // Fallback to first 3 items
      setRecommendations(contentList.slice(0, 3));
    }
  };

  const getContentById = (id) => {
    return content.find(c => c.id === id);
  };

  const getContentByCategory = (category) => {
    return content.filter(c => c.category === category);
  };

  const getFreeContent = () => {
    return content.filter(c => !c.isPremium);
  };

  const getPremiumContent = () => {
    return content.filter(c => c.isPremium);
  };

  const value = {
    content,
    featuredContent,
    recommendations,
    loading,
    getContentById,
    getContentByCategory,
    getFreeContent,
    getPremiumContent
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};