import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Zap, Star, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import ContentCard from '../components/ContentCard';

function HomePage() {
  const { isAuthenticated } = useAuth();
  const { earnTokens } = useTokens();

  // Sample featured content
  const featuredContent = [
    {
      id: '1',
      title: 'Premium Collection #1',
      description: 'Exclusive high-quality content from our top creators',
      type: 'collection',
      duration: '2h 30m',
      previewThumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
      isPremium: true
    },
    {
      id: '2',
      title: 'Free Sample Gallery',
      description: 'Get a taste of what Phyght has to offer',
      type: 'gallery',
      duration: '45m',
      previewThumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      isPremium: false
    },
    {
      id: '3',
      title: 'VIP Experience',
      description: 'Ultra-premium content for our elite members',
      type: 'experience',
      duration: '1h 15m',
      previewThumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400',
      isPremium: true
    }
  ];

  useEffect(() => {
    // Earn tokens for visiting the homepage
    if (isAuthenticated) {
      earnTokens(2, 'Daily visit bonus');
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-bg bg-clip-text text-transparent">
              Unlock exclusive content
            </span>
            <br />
            <span className="text-white">and earn rewards</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join Phyght's revolutionary platform where premium entertainment meets 
            cryptocurrency rewards. Earn PHY tokens and access exclusive content.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <button className="btn-primary text-lg px-8 py-3">
                  Start Free Trial
                </button>
                <Link to="/subscription" className="btn-secondary text-lg px-8 py-3">
                  View Premium Plans
                </Link>
              </>
            ) : (
              <Link to="/library" className="btn-primary text-lg px-8 py-3">
                <Play className="inline h-5 w-5 mr-2" />
                Explore Content
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Phyght?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Experience the future of premium entertainment with our unique token economy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Earn PHY Tokens</h3>
            <p className="text-gray-400">
              Get rewarded for your engagement with our native cryptocurrency
            </p>
          </div>

          <div className="card text-center">
            <Star className="h-12 w-12 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Premium Content</h3>
            <p className="text-gray-400">
              Access exclusive, high-quality content from top creators
            </p>
          </div>

          <div className="card text-center">
            <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Cross-Platform</h3>
            <p className="text-gray-400">
              Enjoy seamless experience across all your devices
            </p>
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Content</h2>
          <Link 
            to="/library" 
            className="text-primary hover:text-primary/80 transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featuredContent.map(content => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg rounded-2xl p-12 text-center">
        <Shield className="h-16 w-16 text-white mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to Join the Revolution?
        </h2>
        <p className="text-white/80 mb-8 max-w-2xl mx-auto">
          Start earning PHY tokens today and unlock premium content. Join thousands of users 
          already earning rewards on Phyght.
        </p>
        
        {!isAuthenticated ? (
          <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Get Started Now
          </button>
        ) : (
          <Link 
            to="/subscription" 
            className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Upgrade to Premium
          </Link>
        )}
      </section>
    </div>
  );
}

export default HomePage;