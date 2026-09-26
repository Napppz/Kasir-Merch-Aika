import React from 'react';
import { usePos } from '../../context/PosContext';
import { getCategoryTheme } from '../../utils/categoryColors';

export const CategoryBar: React.FC = () => {
  const { categories, activeCategory, setActiveCategory } = usePos();

  return (
    <div className="category-pills-bar">
      {categories
        .filter((c) => c.id === 'all' || c.isActive)
        .map((cat) => {
          const isActive = activeCategory === cat.id;
          const theme = cat.id === 'all' ? null : getCategoryTheme(cat.name);

          return (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${isActive ? 'active' : ''}`}
              style={
                isActive
                  ? undefined
                  : theme
                  ? {
                      borderColor: theme.borderColor,
                      background: theme.badgeBg,
                      color: theme.badgeColor,
                    }
                  : undefined
              }
              onClick={() => setActiveCategory(cat.id)}
            >
              {theme?.emoji && <span style={{ marginRight: '4px', fontSize: '13px' }}>{theme.emoji}</span>}
              <span>{cat.name}</span>
            </button>
          );
        })}
    </div>
  );
};
