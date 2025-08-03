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
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="search-bar block w-full pl-10 pr-12 py-3 rounded-sm text-white placeholder-gray-400 focus:outline-none"
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-3">
          {query && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`text-gray-400 hover:text-white transition-colors ${
              showFilters ? 'text-primary-500' : ''
            }`}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-dark-850 rounded-lg p-4 space-y-4 border border-dark-700">
          <h4 className="text-white font-medium">Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Combat Sport
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full bg-dark-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization
              </label>
              <select
                value={filters.organization}
                onChange={(e) => handleFilterChange('organization', e.target.value)}
                className="w-full bg-dark-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full bg-dark-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {['championship', 'knockout', 'submission', 'decision', 'title-fight', 'tournament'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1 bg-dark-700 text-gray-300 rounded-full text-sm hover:bg-red-600 hover:text-white transition-colors"
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
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
