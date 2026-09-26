import React from 'react';
import { usePos } from '../../context/PosContext';

export const CategoryBar: React.FC = () => {
  const { categories, activeCategory, setActiveCategory } = usePos();

  return (
    <div className="category-pills-bar">
      {categories
        .filter((c) => c.id === 'all' || c.isActive)
        .map((cat) => {
          const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            className={`category-pill ${isActive ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};
