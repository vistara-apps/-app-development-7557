import React from 'react';
import { Play, Clock, Lock, Crown, Eye, Users, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

const ContentCard = ({ content, onWatch }) => {
  const { user, openAuthModal } = useAuth();
  const { spendTokens } = useToken();
  const { isFeatureEnabled } = useFeatureFlags();

  const handleWatch = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    // In stealth mode, all content is free
    if (isFeatureEnabled('STEALTH_MODE')) {
      onWatch(content);
      return;
    }

    if (content.isPremium && user.subscriptionStatus !== 'premium') {
      // Try to unlock with tokens or show subscription modal
      if (user.phyghtTokenBalance >= 20) {
        if (confirm(`Unlock this premium fight for 20 Phyght tokens?`)) {
          if (spendTokens(20, `Unlocked: ${content.title}`)) {
            onWatch(content);
          }
        }
      } else {
        window.openSubscriptionModal?.();
      }
      return;
    }

    onWatch(content);
  };

  const canWatch = () => {
    if (isFeatureEnabled('STEALTH_MODE')) return true;
    if (!content.isPremium) return true;
    if (user?.subscriptionStatus === 'premium') return true;
    if (user?.phyghtTokenBalance >= 20) return true;
    return false;
  };

  return (
    <div className="bg-dark-800 rounded-lg overflow-hidden card-hover group">
      <div className="relative aspect-video">
        <img
          src={content.previewThumbnail}
          alt={content.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            onClick={handleWatch}
            className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full transition-colors"
          >
            <Play className="w-6 h-6" />
          </button>
        </div>

        {/* Premium badge - hidden in stealth mode */}
        {content.isPremium && !isFeatureEnabled('STEALTH_MODE') && (
          <div className="absolute top-2 left-2">
            {user?.subscriptionStatus === 'premium' ? (
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-2 py-1 rounded-full flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span className="text-xs font-medium text-white">Premium</span>
              </div>
            ) : (
              <div className="bg-gray-900 bg-opacity-80 px-2 py-1 rounded-full flex items-center space-x-1">
                <Lock className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-500">Premium</span>
              </div>
            )}
          </div>
        )}

        {/* Combat category badge */}
        <div className="absolute top-2 right-2">
          <div className="bg-red-600 bg-opacity-90 px-2 py-1 rounded-full">
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
            <p className="text-sm text-red-400 font-medium">
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
          className={`w-full mt-3 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            canWatch() || !user
              ? 'bg-red-600 hover:bg-red-700 text-white'
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
