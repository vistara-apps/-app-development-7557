import React from 'react';
import { useContent } from '../context/ContentContext';
import { COMBAT_CATEGORIES } from '../config/features';

const CategoryFilter = ({ selectedCategory, onCategoryChange, className = '' }) => {
  const { getCategories } = useContent();
  const categories = getCategories();

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {/* All Categories */}
      <button
        onClick={() => onCategoryChange('all')}
        className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
          selectedCategory === 'all' 
            ? 'bg-gradient-to-r from-phyght-red to-phyght-red-dark text-phyght-white shadow-phyght-red' 
            : 'bg-phyght-gray text-gray-300 hover:text-phyght-white hover:bg-phyght-gray-light border border-phyght-gray-light'
        }`}
      >
        🥊 All Fights
      </button>

      {/* Individual Categories */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${
            selectedCategory === category.id 
              ? 'bg-gradient-to-r from-phyght-red to-phyght-red-dark text-phyght-white shadow-phyght-red' 
              : 'bg-phyght-gray text-gray-300 hover:text-phyght-white hover:bg-phyght-gray-light border border-phyght-gray-light'
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
