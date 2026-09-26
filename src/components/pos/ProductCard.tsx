import React from 'react';
import { Plus, AlertTriangle, Ban } from 'lucide-react';
import type { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { usePos } from '../../context/PosContext';
import { getCategoryTheme } from '../../utils/categoryColors';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, categories } = usePos();
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= Math.max(4, product.minimumStock);

  // Find category name for color coding
  const category = categories.find((c) => c.id === product.categoryId);
  const theme = getCategoryTheme(category?.name || '');

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product);
    }
  };

  return (
    <div
      className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
      style={isOutOfStock ? { opacity: 0.55, cursor: 'not-allowed', filter: 'grayscale(0.6)' } : undefined}
      onClick={handleAdd}
    >
      <div className="product-thumb-wrapper" style={{ position: 'relative' }}>
        <img src={product.image} alt={product.name} loading="lazy" />

        {/* Category Color Tag Badge */}
        {category && (
          <span
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              background: theme.badgeBg,
              color: theme.badgeColor,
              border: `1px solid ${theme.borderColor}`,
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              zIndex: 2,
            }}
          >
            <span>{theme.emoji}</span>
            <span>{category.name}</span>
          </span>
        )}
        
        {/* Prominent Stock Badge */}
        {isOutOfStock ? (
          <span
            className="stock-tag-badge out"
            style={{
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '11px',
              border: '1px solid #ef4444',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
            }}
          >
            <Ban size={12} style={{ marginRight: '2px' }} />
            <span>STOK HABIS</span>
          </span>
        ) : isLowStock ? (
          <span
            className="stock-tag-badge low"
            style={{
              background: 'rgba(245, 158, 11, 0.95)',
              color: '#000000',
              fontWeight: 800,
              fontSize: '11px',
              border: '1px solid #f59e0b',
              boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
            }}
          >
            <AlertTriangle size={12} style={{ marginRight: '2px' }} />
            <span>Sisa {product.stock}!</span>
          </span>
        ) : (
          <span className="stock-tag-badge ready">
            {product.stock} Stok
          </span>
        )}
      </div>

      <div className="product-sku">{product.sku}</div>
      <div className="product-name" title={product.name}>
        {product.name}
      </div>

      <div className="product-price-row">
        <div
          className="product-price"
          style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}
        >
          {formatRupiah(product.price, true, false)}
        </div>
      </div>

      <button
        type="button"
        className="add-product-btn"
        disabled={isOutOfStock}
        onClick={handleAdd}
        style={
          isOutOfStock
            ? { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)', borderColor: 'transparent' }
            : undefined
        }
      >
        {isOutOfStock ? (
          'Habis'
        ) : (
          <>
            <Plus size={14} />
            <span>+ Masuk Keranjang</span>
          </>
        )}
      </button>
    </div>
  );
};
