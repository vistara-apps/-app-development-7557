import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useToken } from '../context/TokenContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import ContentCard from '../components/ContentCard';
import { Crown, Coins, TrendingUp, Play, ArrowRight, Star, Zap, Users, Trophy } from 'lucide-react';

const Home = () => {
  const { user, openAuthModal } = useAuth();
  const { featuredContent, recommendations, loading, getTrendingContent } = useContent();
  const { dailyEarnings, earnTokens } = useToken();
  const { isFeatureEnabled } = useFeatureFlags();





  const handleGetStarted = () => {
    if (user && !isFeatureEnabled('STEALTH_MODE')) {
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
          <p className="text-gray-500 text-sm mt-2">Please wait while we prepare your content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-900/20 to-orange-900/20 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The Ultimate Combat
            <span className="block gradient-text">Video Platform</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            {isFeatureEnabled('STEALTH_MODE') 
              ? 'Watch the best combat sports content from MMA, Boxing, Kickboxing and more. Free access to premium fights and training content.'
              : 'Join Phyght and access premium combat sports content while earning our proprietary cryptocurrency. Every interaction rewards you with Phyght tokens.'
            }
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/browse"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Fights Now
            </Link>

            {!user && (
              <button
                onClick={() => openAuthModal('register')}
                className="border border-gray-600 hover:border-gray-500 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Join Free
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-dark-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">1,200+</div>
              <div className="text-gray-300">Fight Videos</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">150K+</div>
              <div className="text-gray-300">Combat Fans</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500 mb-2">25+</div>
              <div className="text-gray-300">Organizations</div>
            </div>

            {!isFeatureEnabled('STEALTH_MODE') && (
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">5M+</div>
                <div className="text-gray-300">Tokens Earned</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* User Dashboard Widget */}
      {user && (
        <section className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Welcome back, {user.username}!</h2>
              
              <div className={`grid grid-cols-1 ${isFeatureEnabled('STEALTH_MODE') ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                {!isFeatureEnabled('STEALTH_MODE') && (
                  <>
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
                  </>
                )}
                
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Videos Watched</p>
                      <p className="text-2xl font-bold text-white">47</p>
                    </div>
                    <Play className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">
                        {isFeatureEnabled('STEALTH_MODE') ? 'Account Status' : 'Membership'}
                      </p>
                      <p className="text-2xl font-bold text-white capitalize">
                        {isFeatureEnabled('STEALTH_MODE') ? 'Active' : user.subscriptionStatus}
                      </p>
                    </div>
                    {isFeatureEnabled('STEALTH_MODE') ? (
                      <Trophy className="w-8 h-8 text-red-500" />
                    ) : user.subscriptionStatus === 'premium' ? (
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
            <h2 className="text-2xl font-bold text-white">Featured Fights</h2>
            <Link
              to="/browse"
              className="text-red-500 hover:text-red-400 flex items-center"
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
              />
            ))}
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      {user && recommendations.length > 0 && (
        <section className="py-12 px-4 bg-dark-800">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8">Recommended Fights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {recommendations.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
              />
            ))}
            </div>
          </div>
        </section>
      )}

              {/* CTA Section */}
        {!user && (
          <section className="py-16 px-4 bg-gradient-to-r from-red-900/30 to-orange-900/30">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                Join the Combat Community
              </h2>
              
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of combat sports fans watching the best fights from around the world.
              </p>

              <button
                onClick={() => openAuthModal('register')}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
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
