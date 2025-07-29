import React, { useState } from 'react';
import { Play, Lock, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import { usePaymentContext } from '../hooks/usePaymentContext';

function ContentCard({ content }) {
  const { isPremium, isAuthenticated } = useAuth();
  const { spendTokens, balance } = useTokens();
  const { createSession } = usePaymentContext();
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const canAccess = !content.isPremium || isPremium || unlocked;
  const tokenCost = 25; // Cost in PHY tokens

  const handleTokenUnlock = async () => {
    if (balance < tokenCost) {
      alert('Insufficient PHY tokens');
      return;
    }

    try {
      spendTokens(tokenCost, `Unlocked: ${content.title}`);
      setUnlocked(true);
    } catch (error) {
      alert('Error unlocking content');
    }
  };

  const handleCryptoPayment = async () => {
    setLoading(true);
    try {
      await createSession('$2');
      setUnlocked(true);
    } catch (error) {
      alert('Payment failed. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-card">
      <div className="relative aspect-video bg-gray-800">
        <img
          src={content.previewThumbnail}
          alt={content.title}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
          {canAccess ? (
            <Play className="h-12 w-12 text-white" />
          ) : (
            <div className="text-center">
              <Lock className="h-8 w-8 text-white mx-auto mb-2" />
              <span className="text-sm text-white">Premium Content</span>
            </div>
          )}
        </div>

        {content.isPremium && !canAccess && (
          <div className="absolute top-2 right-2">
            <span className="bg-secondary text-white text-xs px-2 py-1 rounded">
              Premium
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold mb-2 line-clamp-2">{content.title}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{content.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{content.duration}</span>
          <span className="capitalize">{content.type}</span>
        </div>

        {content.isPremium && !canAccess && isAuthenticated && (
          <div className="mt-4 space-y-2">
            <button
              onClick={handleTokenUnlock}
              className="w-full flex items-center justify-center space-x-2 bg-primary/20 text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary/30 transition-colors"
              disabled={balance < tokenCost}
            >
              <Zap className="h-4 w-4" />
              <span>Unlock with {tokenCost} PHY</span>
            </button>
            
            <button
              onClick={handleCryptoPayment}
              className="w-full bg-secondary/20 text-secondary border border-secondary px-4 py-2 rounded-lg hover:bg-secondary/30 transition-colors"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay with Crypto ($2)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContentCard;