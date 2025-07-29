import React, { useState } from 'react';
import { Check, Zap, Star, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentContext } from '../hooks/usePaymentContext';

function Subscription() {
  const { user, updateSubscription, isPremium } = useAuth();
  const { createSession } = usePaymentContext();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Star,
      features: [
        'Access to free content',
        'Basic PHY token rewards',
        'Community access',
        'Standard support'
      ],
      buttonText: 'Current Plan',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$10',
      period: 'month',
      icon: Crown,
      features: [
        'Access to all premium content',
        '5x PHY token rewards',
        'Exclusive content library',
        'Early access to new releases',
        'Priority customer support',
        'Ad-free experience'
      ],
      buttonText: 'Upgrade Now',
      popular: true
    }
  ];

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please sign in to subscribe');
      return;
    }

    setLoading(true);
    try {
      await createSession('$10');
      updateSubscription('premium');
      alert('Successfully upgraded to Premium!');
    } catch (error) {
      alert('Payment failed. Please try again.');
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Unlock premium content and maximize your PHY token earnings with our subscription plans
        </p>
      </div>

      {/* Current Status */}
      {user && (
        <div className="card text-center">
          <h2 className="text-xl font-semibold mb-2">Current Status</h2>
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
            isPremium ? 'bg-secondary text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            {isPremium ? <Crown className="h-5 w-5" /> : <Star className="h-5 w-5" />}
            <span>{isPremium ? 'Premium Member' : 'Free Member'}</span>
          </div>
          <p className="text-gray-400 mt-2">
            PHY Balance: <span className="text-primary font-semibold">{user.phyghtTokenBalance} PHY</span>
          </p>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className={`card relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <plan.icon className={`h-12 w-12 mx-auto mb-4 ${
                plan.popular ? 'text-primary' : 'text-gray-400'
              }`} />
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold mb-1">
                {plan.price}
                {plan.period !== 'forever' && (
                  <span className="text-lg font-normal text-gray-400">/{plan.period}</span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={plan.id === 'premium' ? handleSubscribe : undefined}
              disabled={
                loading || 
                (plan.id === 'free') || 
                (plan.id === 'premium' && isPremium)
              }
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.id === 'premium' && !isPremium
                  ? 'btn-primary'
                  : plan.id === 'premium' && isPremium
                  ? 'bg-green-600 text-white cursor-not-allowed'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
              }`}
            >
              {loading && plan.id === 'premium' 
                ? 'Processing...' 
                : plan.id === 'premium' && isPremium
                ? 'Current Plan'
                : plan.buttonText
              }
            </button>
          </div>
        ))}
      </div>

      {/* Token Economy Info */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Zap className="h-8 w-8 text-primary mr-3" />
          <h2 className="text-2xl font-semibold">PHY Token Economy</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-400">Ways to Earn PHY</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Daily login: 2 PHY</li>
              <li>• Watching content: 1-5 PHY</li>
              <li>• Premium subscription: 5x multiplier</li>
              <li>• Referring friends: 50 PHY</li>
              <li>• Completing tasks: 10-25 PHY</li>
              <li>• Community participation: 5-15 PHY</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">Ways to Use PHY</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Unlock premium content: 25 PHY</li>
              <li>• Purchase virtual goods: 10-100 PHY</li>
              <li>• Access exclusive features: 50 PHY</li>
              <li>• Tip content creators: 5-50 PHY</li>
              <li>• Exchange for rewards: Various amounts</li>
              <li>• Withdraw to external wallet</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="card">
        <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Can I cancel my subscription anytime?</h3>
            <p className="text-gray-400">
              Yes, you can cancel your premium subscription at any time. You'll continue to have access 
              to premium features until the end of your billing period.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">What happens to my PHY tokens if I cancel?</h3>
            <p className="text-gray-400">
              Your PHY tokens remain in your account permanently. You can continue to earn and use them 
              even with a free account, just at the standard rate.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Are there any hidden fees?</h3>
            <p className="text-gray-400">
              No hidden fees. The subscription price is all-inclusive. Cryptocurrency transactions 
              may have network fees depending on your wallet and blockchain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subscription;