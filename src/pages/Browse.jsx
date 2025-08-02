import React, { useState } from 'react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import ContentCard from '../components/ContentCard';
import CategoryFilter from '../components/CategoryFilter';
import SearchBar from '../components/SearchBar';
import { Search, Filter, Grid, List } from 'lucide-react';

const Browse = () => {
  const { allContent, loading, getCategories } = useContent();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureFlags();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [filters, setFilters] = useState({});

  const categories = getCategories();



  const filteredContent = allContent || []
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
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading fight library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isFeatureEnabled('STEALTH_MODE') ? 'Browse Fights' : 'Browse Content'}
          </h1>
          <p className="text-gray-400">
            {isFeatureEnabled('STEALTH_MODE') 
              ? 'Discover the best combat sports content from around the world'
              : 'Discover amazing content across all categories'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
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
            placeholder={isFeatureEnabled('STEALTH_MODE') 
              ? "Search fights, fighters, organizations..." 
              : "Search content..."
            }
          />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <CategoryFilter 
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
            
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-dark-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
              >
                <option value="popular">Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Top Rated</option>
                <option value="duration">Duration</option>
                <option value="alphabetical">A-Z</option>
              </select>



              {/* View Mode */}
              <div className="flex border border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
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
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              {isFeatureEnabled('STEALTH_MODE') ? 'No fights found' : 'No content found'}
            </h3>
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
