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
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-900 to-red-700 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-yellow-400">Phyght TV</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            The Ultimate Combat Sports Streaming Platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/browse"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
            >
              Start Watching
            </Link>
            {!user && (
              <Link
                to="/auth"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-red-900 px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
              >
                Sign Up Free
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <Crown className="w-8 h-8 text-yellow-400 mr-3" />
              Featured Content
            </h2>
            <Link
              to="/browse"
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              View All
            </Link>
          </div>
          
          {featuredContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredContent.map((content) => (
                <ContentCard key={content.id} content={content} updateThumbnail={updateVideoThumbnail} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Play className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl">No featured content yet</p>
                <p className="text-sm">Upload your first video to get started!</p>
              </div>
              {user && (
                <Link
                  to="/upload"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                >
                  Upload Video
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Trending Content */}
      <section className="py-16 bg-dark-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <TrendingUp className="w-8 h-8 text-red-400 mr-3" />
              Trending Now
            </h2>
            <Link
              to="/browse"
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              View All
            </Link>
          </div>
          
          {trendingContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingContent.map((content) => (
                <ContentCard key={content.id} content={content} updateThumbnail={updateVideoThumbnail} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl">No trending content yet</p>
                <p className="text-sm">Content will appear here as it gains popularity</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* All Videos Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold flex items-center">
              <Play className="w-8 h-8 text-blue-400 mr-3" />
              All Videos
            </h2>
            <Link
              to="/browse"
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              View All
            </Link>
          </div>
          
          {content.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((content) => (
                <ContentCard key={content.id} content={content} updateThumbnail={updateVideoThumbnail} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Play className="w-16 h-16 mx-auto mb-4" />
                <p className="text-xl">No videos uploaded yet</p>
                <p className="text-sm">Be the first to upload a video!</p>
              </div>
              {user && (
                <Link
                  to="/upload"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                >
                  Upload First Video
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Platform Statistics</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log('🧪 Home: Manual loadContent test...');
                  refreshContent();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🧪 Test Load
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
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🧪 Test URLs
              </button>
              <button
                onClick={refreshContent}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Refreshing...' : '🔄 Refresh Content'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-dark-800 p-6 rounded-lg">
              <div className="text-3xl font-bold text-red-400 mb-2">
                {content.length}
              </div>
              <div className="text-gray-400">Videos Available</div>
            </div>
            <div className="bg-dark-800 p-6 rounded-lg">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {featuredContent.length}
              </div>
              <div className="text-gray-400">Featured Videos</div>
            </div>
            <div className="bg-dark-800 p-6 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {trendingContent.length}
              </div>
              <div className="text-gray-400">Trending Now</div>
            </div>
            <div className="bg-dark-800 p-6 rounded-lg">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {user ? 'Active' : 'Free'}
              </div>
              <div className="text-gray-400">Your Status</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
