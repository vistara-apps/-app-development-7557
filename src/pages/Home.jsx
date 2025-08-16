import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { Play, Clock, Eye, Star, TrendingUp, Crown } from 'lucide-react';
import ContentCard from '../components/ContentCard';

const Home = () => {
  const { 
    getFeaturedContent, 
    getTrendingContent, 
    content, // Add this to get all content
    loading, 
    error,
    refreshContent, // Add this
    updateVideoThumbnail // Add this
  } = useContent();
  
  const { user } = useAuth();

  // Get content from database
  const featuredContent = getFeaturedContent();
  const trendingContent = getTrendingContent();

  // Debug logging
  console.log('🏠 Home page - Featured content:', featuredContent);
  console.log('🏠 Home page - Trending content:', trendingContent);
  console.log('🏠 Home page - All content:', content);
  console.log('🏠 Home page - Total content count:', content.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
              <p className="text-lg font-semibold">Error Loading Content</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-phyght-black via-phyght-gray to-phyght-black text-phyght-white">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-phyght-red to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-phyght-red rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-phyght-red rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-8 font-phyght tracking-wider leading-tight">
            <span className="text-phyght-white drop-shadow-2xl">PHYGHT</span>
            <br />
            <span className="text-phyght-red drop-shadow-2xl">TV</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            The ultimate combat sports streaming platform. Watch, upload, and share the best fights with stunning quality.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/upload"
              className="group bg-gradient-to-r from-phyght-red to-phyght-red-dark hover:from-phyght-red-dark hover:to-phyght-red text-phyght-white px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-500 shadow-phyght-red hover:shadow-phyght-red-lg transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center justify-center space-x-3">
                <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">🎬</span>
                <span>Upload Video</span>
              </span>
            </Link>
            <Link
              to="/browse"
              className="group border-3 border-phyght-red text-phyght-red hover:bg-phyght-red hover:text-phyght-white px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="flex items-center justify-center space-x-3">
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🔍</span>
                <span>Browse Content</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Debug Tools */}
      <div className="px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-phyght-gray to-phyght-gray-light rounded-2xl p-6 border border-phyght-gray-light shadow-xl">
            <h3 className="text-phyght-red font-bold mb-4 text-lg flex items-center">
              <span className="mr-2">🧪</span>
              Developer Tools
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={refreshContent}
                className="bg-gradient-to-r from-phyght-red to-phyght-red-dark hover:from-phyght-red-dark hover:to-phyght-red text-phyght-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-phyght-red"
              >
                🔄 Refresh Content
              </button>
              <button
                onClick={async () => {
                  console.log('🎬 Home: Generating thumbnails for all videos...');
                  try {
                    const { batchGenerateThumbnails } = await import('../services/videoAnalysis');
                    await batchGenerateThumbnails(content);
                    console.log('✅ Thumbnails generated for all videos');
                  } catch (error) {
                    console.error('❌ Failed to generate thumbnails:', error);
                  }
                }}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🎬 Generate Thumbnails
              </button>
              <button
                onClick={async () => {
                  console.log('⏱️ Home: Fixing video durations...');
                  try {
                    const { videoManagementService } = await import('../services/videoManagement');
                    await videoManagementService.fixVideoDurations();
                    console.log('✅ Video durations fixed');
                  } catch (error) {
                    console.error('❌ Failed to fix video durations:', error);
                  }
                }}
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                ⏱️ Fix Durations
              </button>
              <button
                onClick={async () => {
                  console.log('🧪 Home: Testing video URLs...');
                  try {
                    const { videoManagementService } = await import('../services/videoManagement');
                    await videoManagementService.testVideoUrls();
                    console.log('✅ Video URL testing complete');
                  } catch (error) {
                    console.error('❌ Failed to test video URLs:', error);
                  }
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                🧪 Test URLs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Content */}
      {featuredContent.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-phyght-red to-phyght-red-dark rounded-2xl flex items-center justify-center mr-4 shadow-phyght-red">
                <span className="text-2xl">🔥</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-phyght-white">
                Featured Fights
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredContent.map((video) => (
                <ContentCard
                  key={video.id}
                  video={video}
                  updateThumbnail={updateVideoThumbnail}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Content */}
      {trendingContent.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-phyght-red to-phyght-red-dark rounded-2xl flex items-center justify-center mr-4 shadow-phyght-red">
                <span className="text-2xl">📈</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-phyght-white">
                Trending Now
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trendingContent.map((video) => (
                <ContentCard
                  key={video.id}
                  video={video}
                  updateThumbnail={updateVideoThumbnail}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Videos */}
      {content.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 mb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-phyght-red to-phyght-red-dark rounded-2xl flex items-center justify-center mr-4 shadow-phyght-red">
                <span className="text-2xl">🥊</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-phyght-white">
                All Fights
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {content.map((video) => (
                <ContentCard
                  key={video.id}
                  video={video}
                  updateThumbnail={updateVideoThumbnail}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-phyght-gray to-phyght-gray-light">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-phyght-white mb-4">
              Platform Statistics
            </h2>
            <p className="text-gray-300 text-lg">Your combat sports content hub</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-phyght-red to-phyght-red-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-phyght-red group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🎬</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-phyght-red mb-2">
                {content.length}
              </div>
              <div className="text-gray-300 text-lg">Videos Available</div>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-phyght-red to-phyght-red-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-phyght-red group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🔥</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-phyght-red mb-2">
                {featuredContent.length}
              </div>
              <div className="text-gray-300 text-lg">Featured Fights</div>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-phyght-red to-phyght-red-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-phyght-red group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📈</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-phyght-red mb-2">
                {trendingContent.length}
              </div>
              <div className="text-gray-300 text-lg">Trending Now</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
