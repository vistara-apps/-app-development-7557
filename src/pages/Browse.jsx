import React, { useState } from 'react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import ContentCard from '../components/ContentCard';
import { Search, Filter, Grid, List } from 'lucide-react';

const Browse = () => {
  const { content, loading } = useContent();
  const { user } = useAuth();
  const { earnTokens } = useToken();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const categories = [
    { value: 'all', label: 'All Content' },
    { value: 'action', label: 'Action' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'sci-fi', label: 'Sci-Fi' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'adult', label: 'Adult' },
    { value: 'series', label: 'Series' },
    { value: 'exclusive', label: 'Exclusive' }
  ];

  const handleWatchContent = (content) => {
    console.log('Watching content:', content.title);
    // Simulate earning tokens for watching
    if (user) {
      const tokenAmount = user.subscriptionStatus === 'premium' ? 10 : 5;
      earnTokens(tokenAmount, `Watched: ${content.title}`);
    }
  };

  const filteredContent = content
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesPremium = !showPremiumOnly || item.isPremium;
      
      return matchesSearch && matchesCategory && matchesPremium;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || '2024-01-01') - new Date(a.createdAt || '2024-01-01');
        case 'rating':
          return b.rating - a.rating;
        case 'duration':
          return parseFloat(b.duration) - parseFloat(a.duration);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default: // popular
          return b.views - a.views;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading content library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Content</h1>
          <p className="text-gray-400">
            Discover amazing content across all categories
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-dark-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-dark-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-dark-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="popular">Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>
                <option value="duration">Duration</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>

            {/* Filters */}
            <div className="lg:col-span-2 flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-white">
                <input
                  type="checkbox"
                  checked={showPremiumOnly}
                  onChange={(e) => setShowPremiumOnly(e.target.checked)}
                  className="rounded text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm">Premium only</span>
              </label>
            </div>

            {/* View Mode */}
            <div className="lg:col-span-1 flex justify-end">
              <div className="flex border border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">
            {filteredContent.length} {filteredContent.length === 1 ? 'result' : 'results'} found
          </p>
          
          {user && user.subscriptionStatus !== 'premium' && (
            <button
              onClick={() => window.openSubscriptionModal?.()}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              Unlock All Premium Content
            </button>
          )}
        </div>

        {/* Content Grid */}
        {filteredContent.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredContent.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onWatch={handleWatchContent}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No content found</h3>
            <p className="text-gray-400">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;