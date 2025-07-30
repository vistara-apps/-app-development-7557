import React from 'react';
import { useContent } from '../context/ContentContext';
import { COMBAT_CATEGORIES } from '../config/features';

const CategoryFilter = ({ selectedCategory, onCategoryChange, className = '' }) => {
  const { getCategories } = useContent();
  const categories = getCategories();

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* All Categories */}
      <button
        onClick={() => onCategoryChange('all')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          selectedCategory === 'all'
            ? 'bg-red-600 text-white'
            : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
        }`}
      >
        All Fights
      </button>

      {/* Individual Categories */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
            selectedCategory === category.id
              ? 'bg-red-600 text-white'
              : 'bg-dark-700 text-gray-300 hover:bg-dark-600 hover:text-white'
          }`}
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;

