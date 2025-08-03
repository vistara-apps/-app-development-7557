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
        className={`category-pill px-4 py-2 rounded-sm text-sm font-medium ${
          selectedCategory === 'all' ? 'active' : ''
        }`}
      >
        All Fights
      </button>

      {/* Individual Categories */}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`category-pill px-4 py-2 rounded-sm text-sm font-medium flex items-center space-x-2 ${
            selectedCategory === category.id ? 'active' : ''
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
