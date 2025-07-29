import React, { useState } from 'react';
import { X, Crown, Check, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentContext } from '../hooks/usePaymentContext';

const SubscriptionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, updateSubscription, openAuthModal } = useAuth();
  const { createSession } = usePaymentContext();

  const handleSubscribe = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setLoading(true);
    try {
      await createSession('$10');
      updateSubscription('premium');
      setIsOpen(false);
    } catch (error) {
      console.error('Subscription failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  // Expose openModal function globally for other components
  React.useEffect(() => {
    window.openSubscriptionModal = openModal;
    return () => {
      delete window.openSubscriptionModal;
    };
  }, []);

  const premiumFeatures = [
    'Access to all premium content',
    'Ad-free streaming experience',
    'Early access to new releases',
    'Exclusive behind-the-scenes content',
    'Earn 2x Phyght tokens',
    'Priority customer support',
    'HD quality streaming',
    'Offline download capability'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-dark-800 rounded-lg max-w-lg w-full p-6 relative">
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Upgrade to Premium
          </h2>
          <p className="text-gray-400">
            Unlock exclusive content and enhance your experience
          </p>
        </div>

        <div className="bg-dark-900 rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-white mb-1">$10</div>
            <div className="text-gray-400">per month</div>
          </div>

          <ul className="space-y-3 mb-6">
            {premiumFeatures.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-300">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-primary-900/20 border border-primary-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <Coins className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-white">Token Bonus</span>
          </div>
          <p className="text-sm text-gray-300">
            Premium members earn double Phyght tokens on all activities!
          </p>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
        >
          {loading ? (
            'Processing...'
          ) : (
            <>
              <Crown className="w-5 h-5 mr-2" />
              Subscribe Now
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          Cancel anytime. Your subscription will auto-renew monthly.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionModal;