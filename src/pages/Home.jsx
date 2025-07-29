import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useToken } from '../context/TokenContext';
import ContentCard from '../components/ContentCard';
import { Crown, Coins, TrendingUp, Play, ArrowRight, Star } from 'lucide-react';

const Home = () => {
  const { user, openAuthModal } = useAuth();
  const { featuredContent, recommendations, loading } = useContent();
  const { dailyEarnings, earnTokens } = useToken();

  const handleWatchContent = (content) => {
    console.log('Watching content:', content.title);
    // Simulate earning tokens for watching
    if (user) {
      const tokenAmount = user.subscriptionStatus === 'premium' ? 10 : 5;
      earnTokens(tokenAmount, `Watched: ${content.title}`);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      window.openSubscriptionModal?.();
    } else {
      openAuthModal('register');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-900/20 to-purple-900/20 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Unlock Exclusive Content,
            <span className="block gradient-text">Earn Real Rewards</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join Phyght and access premium adult entertainment while earning our proprietary cryptocurrency. 
            Every interaction rewards you with Phyght tokens.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Crown className="w-5 h-5 mr-2" />
              {user ? 'Upgrade to Premium' : 'Start Free Trial'}
            </button>
            
            <Link
              to="/browse"
              className="border border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Browse Content
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-2">500+</div>
              <div className="text-gray-300">Premium Videos</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-2">50K+</div>
              <div className="text-gray-300">Active Members</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500 mb-2">1M+</div>
              <div className="text-gray-300">Tokens Earned</div>
            </div>
          </div>
        </div>
      </section>

      {/* User Dashboard Widget */}
      {user && (
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-primary-900/30 to-purple-900/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Welcome back, {user.username}!</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Token Balance</p>
                      <p className="text-2xl font-bold text-white">{user.phyghtTokenBalance}</p>
                    </div>
                    <Coins className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Today's Earnings</p>
                      <p className="text-2xl font-bold text-green-500">+{dailyEarnings}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Membership</p>
                      <p className="text-2xl font-bold text-white capitalize">
                        {user.subscriptionStatus}
                      </p>
                    </div>
                    {user.subscriptionStatus === 'premium' ? (
                      <Crown className="w-8 h-8 text-yellow-500" />
                    ) : (
                      <Star className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Content */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Featured Content</h2>
            <Link
              to="/browse"
              className="text-primary-500 hover:text-primary-400 flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onWatch={handleWatchContent}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      {user && recommendations.length > 0 && (
        <section className="py-12 px-4 bg-dark-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Recommended for You</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onWatch={handleWatchContent}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="py-16 px-4 bg-gradient-to-r from-primary-900/30 to-purple-900/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of members earning Phyght tokens while enjoying premium content.
            </p>

            <button
              onClick={() => openAuthModal('register')}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
            >
              Create Free Account
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;