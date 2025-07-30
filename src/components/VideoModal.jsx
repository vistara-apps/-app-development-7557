import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

const VideoModal = ({ isOpen, onClose, content }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { user } = useAuth();
  const { earnTokens } = useToken();
  const { isFeatureEnabled } = useFeatureFlags();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="relative w-full max-w-6xl mx-4 bg-dark-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-dark-800">
          <div>
            <h2 className="text-white text-lg font-semibold">{content.title}</h2>
            {content.fighters && (
              <p className="text-red-400 text-sm">{content.fighters.join(' vs ')}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Player */}
        <div className="aspect-video">
          <VideoPlayer
            src={content.contentFile}
            poster={content.previewThumbnail}
            title={content.title}
            autoPlay={true}
            onTimeUpdate={(time) => {
              // Track video progress for analytics
              console.log(`Video progress: ${time}s`);
            }}
            onEnded={() => {
              console.log('Video ended');
              // Earn tokens for watching (only if not in stealth mode)
              if (user && !isFeatureEnabled('STEALTH_MODE')) {
                const tokenAmount = user.subscriptionStatus === 'premium' ? 10 : 5;
                earnTokens(tokenAmount, `Watched: ${content.title}`);
              }
            }}
          />
        </div>

        {/* Video Info */}
        <div className="p-4 bg-dark-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>{content.duration}</span>
              <span>{content.views?.toLocaleString()} views</span>
              <span>⭐ {content.rating}</span>
            </div>
            <div className="text-sm text-gray-400">
              {content.organization} • {content.weightClass}
            </div>
          </div>
          
          <p className="text-gray-300 text-sm leading-relaxed">
            {content.description}
          </p>
          
          {content.tags && (
            <div className="flex flex-wrap gap-2 mt-3">
              {content.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded-full"
                >
                  {tag}
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