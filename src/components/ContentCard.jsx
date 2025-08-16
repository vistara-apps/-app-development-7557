import React, { useState } from 'react';
import { Play, Clock, Eye, Image, RefreshCw, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVideo } from '../context/VideoContext';
import videoAnalysisService from '../services/videoAnalysis';

const ContentCard = ({ video, updateThumbnail }) => {
  const { user, openAuthModal } = useAuth();
  const { openVideoModal } = useVideo();
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const handleWatch = () => {
    openVideoModal(video);
  };

  const canWatch = () => {
    return true; // All content is free to watch
  };

  const handleThumbnailError = () => {
    setThumbnailError(true);
  };

  const generateThumbnail = async () => {
    if (!video.contentFile && !video.content_file) {
      console.error('No video file available for thumbnail generation');
      return;
    }

    setGeneratingThumbnail(true);
    try {
      // For now, we'll use a random image as placeholder
      // In production, you'd call your thumbnail generation API
      const newThumbnail = `https://picsum.photos/320/180?random=${video.id}-${Date.now()}`;
      
      // Update the content with new thumbnail
      if (updateThumbnail) {
        updateThumbnail(video.id, newThumbnail);
      }
      
      setThumbnailError(false);
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  return (
    <div 
      className="bg-phyght-gray rounded-xl overflow-hidden shadow-lg hover:shadow-phyght-red transition-all duration-300 transform hover:scale-105 border border-phyght-gray-light cursor-pointer group"
      onClick={handleWatch}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-phyght-black overflow-hidden">
        <img
          src={video.previewThumbnail || video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            console.log('🖼️ Thumbnail failed to load for:', video.title);
            e.target.style.display = 'none';
            setThumbnailError(true);
          }}
        />
        
        {/* Placeholder with Generate Button */}
        {thumbnailError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-phyght-gray to-phyght-black">
            <div className="text-phyght-red text-6xl mb-4 animate-pulse">🎬</div>
            <p className="text-phyght-white text-sm mb-3 text-center px-4">No thumbnail available</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                generateThumbnail();
              }}
              className="bg-phyght-red hover:bg-phyght-red-dark text-phyght-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-phyght-red"
            >
              Generate Thumbnail
            </button>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="bg-phyght-red bg-opacity-95 rounded-full p-5 transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-phyght-red">
            <Play className="w-10 h-10 text-phyght-white" />
          </div>
        </div>
        
        {/* Duration Badge */}
        <div className="absolute bottom-3 right-3 bg-phyght-black bg-opacity-90 text-phyght-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
          {video.duration || '0:00'}
        </div>
        
        {/* Category Badge - Top Left */}
        {video.category && (
          <div className="absolute top-3 left-3">
            <span className="inline-block bg-phyght-red text-phyght-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              {video.category?.replace('-', ' ') || 'Combat'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-phyght-white mb-2 line-clamp-2 text-lg group-hover:text-phyght-red transition-colors duration-300">
          {video.title}
        </h3>
        <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
          {video.description}
        </p>
        
        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-3 text-gray-400">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4 text-phyght-red" />
              <span>{video.views?.toLocaleString() || 0} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-phyght-red" />
              <span>{video.rating || 4.5}</span>
            </div>
          </div>
          
          {/* Watch Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleWatch();
            }}
            className="bg-phyght-red hover:bg-phyght-red-dark text-phyght-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-phyght-red"
          >
            Watch Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
