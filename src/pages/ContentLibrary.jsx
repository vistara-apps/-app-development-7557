import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTokens } from '../context/TokenContext';
import ContentCard from '../components/ContentCard';

function ContentLibrary() {
  const { isAuthenticated, isPremium } = useAuth();
  const { earnTokens } = useTokens();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredContent, setFilteredContent] = useState([]);

  // Sample content data
  const allContent = [
    {
      id: '1',
      title: 'Premium Collection #1',
      description: 'Exclusive high-quality content from our top creators',
      type: 'collection',
      duration: '2h 30m',
      previewThumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
      isPremium: true,
      category: 'featured'
    },
    {
      id: '2',
      title: 'Free Sample Gallery',
      description: 'Get a taste of what Phyght has to offer',
      type: 'gallery',
      duration: '45m',
      previewThumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      isPremium: false,
      category: 'free'
    },
    {
      id: '3',
      title: 'VIP Experience',
      description: 'Ultra-premium content for our elite members',
      type: 'experience',
      duration: '1h 15m',
      previewThumbnail: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400',
      isPremium: true,
      category: 'vip'
    },
    {
      id: '4',
      title: 'Starter Pack',
      description: 'Perfect introduction to our platform',
      type: 'pack',
      duration: '30m',
      previewThumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
      isPremium: false,
      category: 'free'
    },
    {
      id: '5',
      title: 'Elite Series',
      description: 'Our most exclusive content series',
      type: 'series',
      duration: '3h 45m',
      previewThumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      isPremium: true,
      category: 'featured'
    },
    {
      id: '6',
      title: 'Behind the Scenes',
      description: 'Exclusive behind-the-scenes content',
      type: 'documentary',
      duration: '1h 20m',
      previewThumbnail: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400',
      isPremium: true,
      category: 'exclusive'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Content' },
    { id: 'free', name: 'Free' },
    { id: 'featured', name: 'Featured' },
    { id: 'vip', name: 'VIP' },
    { id: 'exclusive', name: 'Exclusive' }
  ];

  useEffect(() => {
    let filtered = allContent;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(content => content.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(content =>
        content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContent(filtered);
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    // Earn tokens for browsing content
    if (isAuthenticated) {
      earnTokens(1, 'Browsing content library');
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <h1 className="text-3xl font-bold">Content Library</h1>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-dark text-gray-400'}`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-dark text-gray-400'}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark border border-gray-600 rounded-lg focus:outline-none focus:border-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-dark border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Grid/List */}
      {filteredContent.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-6'
        }>
          {filteredContent.map(content => (
            <ContentCard key={content.id} content={content} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No content found matching your filters.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="mt-4 text-primary hover:text-primary/80"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Premium CTA */}
      {!isPremium && (
        <div className="card text-center">
          <h3 className="text-xl font-semibold mb-4">Want More Content?</h3>
          <p className="text-gray-400 mb-6">
            Upgrade to Premium and unlock our entire library of exclusive content plus earn more PHY tokens!
          </p>
          <button className="btn-primary">
            Upgrade to Premium
          </button>
        </div>
      )}
    </div>
  );
}

export default ContentLibrary;