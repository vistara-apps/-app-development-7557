import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useContent } from '../context/ContentContext';

const SearchBar = ({ 
  onSearch, 
  onFilterChange, 
  placeholder = "Search fights, fighters, organizations...",
  className = '' 
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    organization: 'all',
    type: 'all'
  });

  const { getOrganizations, getCategories } = useContent();
  const organizations = getOrganizations();
  const categories = getCategories();

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch?.(query, filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, filters, onSearch]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearSearch = () => {
    setQuery('');
    setFilters({
      category: 'all',
      organization: 'all',
      type: 'all'
    });
  };

  const fightTypes = [
    { id: 'all', name: 'All Types' },
    { id: 'full-fight', name: 'Full Fights' },
    { id: 'highlight', name: 'Highlights' },
    { id: 'training', name: 'Training' },
    { id: 'full-match', name: 'Full Matches' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="block w-full pl-12 pr-16 py-4 rounded-xl text-phyght-white placeholder-gray-400 focus:outline-none bg-phyght-black border-2 border-phyght-gray-light focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300"
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-3 pr-4">
          {query && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-phyght-red transition-colors duration-300 p-1 rounded-lg hover:bg-phyght-gray-light"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`text-gray-400 hover:text-phyght-red transition-colors duration-300 p-2 rounded-lg hover:bg-phyght-gray-light ${
              showFilters ? 'text-phyght-red bg-phyght-gray-light' : ''
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gradient-to-r from-phyght-gray to-phyght-gray-light rounded-2xl p-6 space-y-6 border border-phyght-gray-light shadow-xl">
          <h4 className="text-phyght-white font-bold text-lg">🔍 Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-phyght-white mb-3">
                🥊 Combat Sport
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full bg-phyght-black text-phyght-white border-2 border-phyght-gray-light rounded-xl px-4 py-3 focus:outline-none focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300"
              >
                <option value="all">All Sports</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Organization Filter */}
            <div>
              <label className="block text-sm font-semibold text-phyght-white mb-3">
                🏆 Organization
              </label>
              <select
                value={filters.organization}
                onChange={(e) => handleFilterChange('organization', e.target.value)}
                className="w-full bg-phyght-black text-phyght-white border-2 border-phyght-gray-light rounded-xl px-4 py-3 focus:outline-none focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300"
              >
                <option value="all">All Organizations</option>
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-phyght-white mb-3">
                📺 Content Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full bg-phyght-black text-phyght-white border-2 border-phyght-gray-light rounded-xl px-4 py-3 focus:outline-none focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300"
              >
                {fightTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div>
            <label className="block text-sm font-semibold text-phyght-white mb-3">
              ⚡ Quick Filters
            </label>
            <div className="flex flex-wrap gap-3">
              {['championship', 'knockout', 'submission', 'decision', 'title-fight', 'tournament'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-4 py-2 bg-phyght-black text-gray-300 rounded-xl text-sm hover:bg-phyght-red hover:text-phyght-white transition-all duration-300 border border-phyght-gray-light hover:border-phyght-red transform hover:scale-105"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              onClick={clearSearch}
              className="px-6 py-3 bg-gradient-to-r from-phyght-red to-phyght-red-dark hover:from-phyght-red-dark hover:to-phyght-red text-phyght-white rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-phyght-red"
            >
              🗑️ Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
