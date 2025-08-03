import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CategorySection = () => {
  const categories = [
    {
      id: 'mma',
      name: 'MMA',
      description: 'Mixed Martial Arts',
      videoCount: '450+',
      thumbnail: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'boxing',
      name: 'Boxing',
      description: 'Professional Boxing',
      videoCount: '320+',
      thumbnail: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=300&fit=crop',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'kickboxing',
      name: 'Kickboxing',
      description: 'Kickboxing & Muay Thai',
      videoCount: '280+',
      thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'wrestling',
      name: 'Wrestling',
      description: 'Professional Wrestling',
      videoCount: '150+',
      thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'bjj',
      name: 'BJJ',
      description: 'Brazilian Jiu-Jitsu',
      videoCount: '120+',
      thumbnail: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=300&fit=crop',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'karate',
      name: 'Karate',
      description: 'Traditional Karate',
      videoCount: '90+',
      thumbnail: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=300&fit=crop',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <section className="py-12 px-4 bg-dark-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Browse by Category</h2>
          <Link
            to="/browse"
            className="text-primary-500 hover:text-primary-400 flex items-center font-medium"
          >
            View All Categories
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/browse?category=${category.id}`}
              className="group relative aspect-square rounded-lg overflow-hidden card-hover"
            >
              <img
                src={category.thumbnail}
                alt={category.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-bold text-lg mb-1">
                    {category.name}
                  </h3>
                  <p className="text-gray-300 text-xs mb-1">
                    {category.description}
                  </p>
                  <p className="text-primary-400 text-xs font-medium">
                    {category.videoCount} videos
                  </p>
                </div>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary-500 text-white px-4 py-2 rounded-sm font-medium text-sm">
                    Browse {category.name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
