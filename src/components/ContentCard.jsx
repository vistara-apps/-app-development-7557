import React, { useState } from 'react';
import { Play, Clock, Eye, Image, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVideo } from '../context/VideoContext';
import videoAnalysisService from '../services/videoAnalysis';

const ContentCard = ({ content, updateThumbnail }) => {
  const { user, openAuthModal } = useAuth();
  const { openVideoModal } = useVideo();
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const handleWatch = () => {
    openVideoModal(content);
  };

  const canWatch = () => {
    return true; // All content is free to watch
  };

  const handleThumbnailError = () => {
    setThumbnailError(true);
  };

  const generateThumbnail = async () => {
    if (!content.contentFile && !content.content_file) {
      console.error('No video file available for thumbnail generation');
      return;
    }

    setGeneratingThumbnail(true);
    try {
      // For now, we'll use a random image as placeholder
      // In production, you'd call your thumbnail generation API
      const newThumbnail = `https://picsum.photos/320/180?random=${content.id}-${Date.now()}`;
      
      // Update the content with new thumbnail
      if (updateThumbnail) {
        updateThumbnail(content.id, newThumbnail);
      }
      
      setThumbnailError(false);
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
    } finally {
      setGeneratingThumbnail(false);
    }
  };

  return (
    <div className="bg-dark-850 rounded-lg overflow-hidden card-hover group border border-dark-700">
      <div className="relative aspect-video">
        {thumbnailError ? (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-2">Thumbnail failed to load</p>
              <button
                onClick={generateThumbnail}
                disabled={generatingThumbnail}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs flex items-center mx-auto"
              >
                {generatingThumbnail ? (
                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Image className="w-3 h-3 mr-1" />
                )}
                Generate Thumbnail
              </button>
            </div>
          </div>
        ) : (
          <img
            src={content.previewThumbnail}
            alt={content.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={handleThumbnailError}
          />
        )}
        
        <div className="absolute inset-0 video-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={handleWatch}
            className="bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 shadow-glow"
          >
            <Play className="w-6 h-6" />
          </button>
        </div>


        {/* Combat category badge */}
        <div className="absolute top-2 right-2">
          <div className="bg-primary-500 bg-opacity-90 px-2 py-1 rounded-sm">
            <span className="text-xs font-medium text-white uppercase">
              {content.category?.replace('-', ' ') || 'Combat'}
            </span>
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-2 py-1 rounded flex items-center space-x-1">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-xs text-white">{content.duration}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-white font-medium mb-2 line-clamp-2">
          {content.title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {content.description}
        </p>

        {/* Combat-specific metadata */}
        {content.fighters && (
          <div className="mb-2">
            <p className="text-sm text-primary-400 font-medium">
              {content.fighters.join(' vs ')}
            </p>
            {content.organization && (
              <p className="text-xs text-gray-500">
                {content.organization} • {content.weightClass}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>{content.views?.toLocaleString()} views</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span>⭐</span>
            <span>{content.rating}</span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleWatch}
          className="w-full mt-3 py-2 px-4 rounded-sm text-sm font-medium transition-all duration-200 ph-button"
        >
          Watch Fight
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
