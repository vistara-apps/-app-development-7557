import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '../context/AuthContext';

const VideoModal = ({ isOpen, onClose, content }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-phyght-black bg-opacity-95 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl mx-4 bg-gradient-to-r from-phyght-gray to-phyght-gray-light rounded-2xl overflow-hidden border border-phyght-gray-light shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-phyght-black to-phyght-gray border-b border-phyght-gray-light">
          <div>
            <h2 className="text-phyght-white text-xl font-bold mb-2">{content.title}</h2>
            {content.fighters && (
              <p className="text-phyght-red text-sm font-semibold">{content.fighters.join(' vs ')}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-phyght-red transition-colors duration-300 p-2 rounded-lg hover:bg-phyght-gray-light"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Player */}
        <div className="aspect-video">
          <VideoPlayer
            src={content.contentFile || content.content_file}
            poster={content.previewThumbnail || content.thumbnail}
            title={content.title}
            autoPlay={true}
            onTimeUpdate={(time) => {
              // Track video progress for analytics
              console.log(`Video progress: ${time}s`);
            }}
            onEnded={() => {
              console.log('Video ended');
            }}
          />
        </div>

        {/* Video Info */}
        <div className="p-6 bg-gradient-to-r from-phyght-black to-phyght-gray">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-6 text-sm text-gray-300">
              <span className="flex items-center space-x-2">
                <span className="text-phyght-red">⏱️</span>
                <span>{content.duration || '0:00'}</span>
              </span>
              <span className="flex items-center space-x-2">
                <span className="text-phyght-red">👁️</span>
                <span>{content.views?.toLocaleString() || 0} views</span>
              </span>
              <span className="flex items-center space-x-2">
                <span className="text-phyght-red">⭐</span>
                <span>{content.rating || 4.5}</span>
              </span>
            </div>
            <div className="text-sm text-gray-300">
              {content.organization || 'Unknown'} • {content.weightClass || 'N/A'}
            </div>
          </div>
          
          <p className="text-gray-300 text-base leading-relaxed mb-4">
            {content.description || 'No description available'}
          </p>
          
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {content.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-phyght-red to-phyght-red-dark text-phyght-white text-xs rounded-full font-medium shadow-phyght-red"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoModal; 