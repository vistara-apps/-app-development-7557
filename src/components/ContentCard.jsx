import React from 'react';
import { Play, Clock, Lock, Crown, Eye, Users, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { useVideo } from '../context/VideoContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

const ContentCard = ({ content }) => {
  const { user, openAuthModal } = useAuth();
  const { spendTokens } = useToken();
  const { openVideoModal } = useVideo();
  const { isFeatureEnabled } = useFeatureFlags();

  const handleWatch = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    // In stealth mode, all content is free
    if (isFeatureEnabled('STEALTH_MODE')) {
      openVideoModal(content);
      return;
    }

    if (content.isPremium && user.subscriptionStatus !== 'premium') {
      // Try to unlock with tokens or show subscription modal
      if (user.phyghtTokenBalance >= 20) {
        if (confirm(`Unlock this premium fight for 20 Phyght tokens?`)) {
          if (spendTokens(20, `Unlocked: ${content.title}`)) {
            openVideoModal(content);
          }
        }
      } else {
        window.openSubscriptionModal?.();
      }
      return;
    }

    openVideoModal(content);
  };

  const canWatch = () => {
    if (isFeatureEnabled('STEALTH_MODE')) return true;
    if (!content.isPremium) return true;
    if (user?.subscriptionStatus === 'premium') return true;
    if (user?.phyghtTokenBalance >= 20) return true;
    return false;
  };

  return (
    <div className="bg-dark-850 rounded-lg overflow-hidden card-hover group border border-dark-700">
      <div className="relative aspect-video">
        <img
          src={content.previewThumbnail}
          alt={content.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        <div className="absolute inset-0 video-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={handleWatch}
            className="bg-primary-500 hover:bg-primary-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110 shadow-glow"
          >
            <Play className="w-6 h-6" />
          </button>
        </div>

        {/* Premium badge - hidden in stealth mode */}
        {content.isPremium && !isFeatureEnabled('STEALTH_MODE') && (
          <div className="absolute top-2 left-2">
            {user?.subscriptionStatus === 'premium' ? (
              <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 px-2 py-1 rounded-sm flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span className="text-xs font-medium text-white">Premium</span>
              </div>
            ) : (
              <div className="bg-dark-900 bg-opacity-90 px-2 py-1 rounded-sm flex items-center space-x-1 border border-secondary-500/30">
                <Lock className="w-3 h-3 text-secondary-500" />
                <span className="text-xs font-medium text-secondary-500">Premium</span>
              </div>
            )}
          </div>
        )}

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
          disabled={!canWatch() && !user}
          className={`w-full mt-3 py-2 px-4 rounded-sm text-sm font-medium transition-all duration-200 ${
            canWatch() || !user
              ? 'ph-button'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          }`}
        >
          {!user ? 'Login to Watch' : 
           isFeatureEnabled('STEALTH_MODE') ? 'Watch Fight' :
           content.isPremium && user.subscriptionStatus !== 'premium' 
             ? user.phyghtTokenBalance >= 20 ? 'Unlock (20 tokens)' : 'Upgrade to Premium'
             : 'Watch Fight'}
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
