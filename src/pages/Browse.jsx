import React, { useState } from 'react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import ContentCard from '../components/ContentCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import { Search, Filter, Grid, List } from 'lucide-react';

const Browse = () => {
  const { content, loading, getCategories } = useContent();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [filters, setFilters] = useState({});

  const categories = getCategories();

  const filteredContent = (content || [])
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.fighters && item.fighters.some(fighter => 
                            fighter.toLowerCase().includes(searchTerm.toLowerCase())
                          )) ||
                          (item.organization && item.organization.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesPremium = !showPremiumOnly || item.isPremium;
      
      return matchesSearch && matchesCategory && matchesPremium;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.uploaded_at || '2024-01-01') - new Date(a.uploaded_at || '2024-01-01');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'duration':
          return parseFloat(b.duration || '0') - parseFloat(a.duration || '0');
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default: // popular
          return (b.views || 0) - (a.views || 0);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-phyght-black via-phyght-gray to-phyght-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-phyght-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-phyght-white text-lg">Loading fight library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-phyght-black via-phyght-gray to-phyght-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-phyght-white mb-4 font-phyght tracking-wider">
            <span className="text-phyght-white">BROWSE</span>
            <br />
            <span className="text-phyght-red">FIGHTS</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Discover the best combat sports content from around the world
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 space-y-8">
          <SearchBar 
            onSearch={(query, searchFilters) => {
              setSearchTerm(query);
              if (searchFilters) {
                setFilters(searchFilters);
                if (searchFilters.category && searchFilters.category !== 'all') {
                  setSelectedCategory(searchFilters.category);
                }
              }
            }}
            placeholder="Search fights, fighters, organizations..."
          />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <CategoryFilter 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-phyght-black border-2 border-phyght-gray-light rounded-xl text-phyght-white focus:outline-none focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300"
              >
                <option value="popular">🔥 Popular</option>
                <option value="newest">🆕 Newest</option>
                <option value="rating">⭐ Top Rated</option>
                <option value="duration">⏱️ Duration</option>
                <option value="alphabetical">🔤 A-Z</option>
              </select>

              {/* View Mode */}
              <div className="flex border-2 border-phyght-gray-light rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-phyght-red to-phyght-red-dark text-phyght-white shadow-phyght-red' 
                      : 'text-gray-400 hover:text-phyght-white hover:bg-phyght-gray-light'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-phyght-red to-phyght-red-dark text-phyght-white shadow-phyght-red' 
                      : 'text-gray-400 hover:text-phyght-white hover:bg-phyght-gray-light'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-8">
          <div className="bg-gradient-to-r from-phyght-gray to-phyght-gray-light rounded-xl px-6 py-3 border border-phyght-gray-light">
            <p className="text-phyght-white font-semibold">
              {filteredContent.length} {filteredContent.length === 1 ? 'fight' : 'fights'} found
            </p>
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length > 0 ? (
          <div className={`grid gap-8 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredContent.map((video) => (
              <ContentCard
                key={video.id}
                video={video}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gradient-to-r from-phyght-gray to-phyght-gray-light rounded-2xl p-12 border border-phyght-gray-light max-w-md mx-auto">
              <div className="text-phyght-red text-6xl mb-6">🥊</div>
              <h3 className="text-2xl font-bold text-phyght-white mb-4">
                No fights found
              </h3>
              <p className="text-gray-300 mb-6">
                Try adjusting your search terms or filters to discover amazing content
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setFilters({});
                }}
                className="bg-gradient-to-r from-phyght-red to-phyght-red-dark text-phyght-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-phyght-red"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;
