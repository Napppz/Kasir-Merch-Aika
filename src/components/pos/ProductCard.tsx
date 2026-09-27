import React from 'react';
import { Plus, AlertTriangle, Ban } from 'lucide-react';
import type { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { usePos } from '../../context/PosContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart } = usePos();
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= Math.max(4, product.minimumStock);

  // Check if item is already in cart
  const cartItem = cart.find((i) => i.product.id === product.id);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product);
    }
  };

  return (
    <div
      className={`product-card ${isOutOfStock ? 'out-of-stock' : ''} ${isLowStock ? 'low-stock-card' : ''} ${inCartQty > 0 ? 'in-cart-active' : ''}`}
      style={isOutOfStock ? { opacity: 0.55, cursor: 'not-allowed', filter: 'grayscale(0.6)' } : undefined}
      onClick={handleAdd}
    >
      <div className="product-thumb-wrapper" style={{ position: 'relative' }}>
        <img src={product.image} alt={product.name} loading="lazy" />

        {/* In-cart count badge (prominent green confirmation) */}
        {inCartQty > 0 && (
          <span className="in-cart-pill-badge">
            ✓ {inCartQty} di Keranjang
          </span>
        )}

        {/* Only show stock badge if Low Stock or Out of Stock */}
        {isOutOfStock ? (
          <span
            className="stock-tag-badge out"
            style={{
              background: 'rgba(239, 68, 68, 0.95)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '10px',
              border: '1px solid #ef4444',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
            }}
          >
            <Ban size={11} style={{ marginRight: '2px' }} />
            <span>HABIS</span>
          </span>
        ) : isLowStock ? (
          <span
            className="stock-tag-badge low"
            style={{
              background: 'rgba(245, 158, 11, 0.95)',
              color: '#000000',
              fontWeight: 800,
              fontSize: '10px',
              border: '1px solid #f59e0b',
              boxShadow: '0 0 8px rgba(245, 158, 11, 0.4)',
            }}
          >
            <AlertTriangle size={11} style={{ marginRight: '2px' }} />
            <span>Sisa {product.stock}!</span>
          </span>
        ) : null}
      </div>

      <div className="product-sku desktop-only">{product.sku}</div>
      <div className="product-name" title={product.name}>
        {product.name}
      </div>

      <div className="product-price-row">
        <div className="product-price">
          {formatRupiah(product.price, true, false)}
        </div>
        <button
          type="button"
          className={`quick-add-btn ${inCartQty > 0 ? 'has-qty' : ''}`}
          disabled={isOutOfStock}
          onClick={handleAdd}
          title={isOutOfStock ? 'Stok habis' : 'Tambah ke keranjang'}
        >
          {isOutOfStock ? (
            <span style={{ fontSize: '10px' }}>Habis</span>
          ) : inCartQty > 0 ? (
            <span>+{inCartQty}</span>
          ) : (
            <Plus size={15} />
          )}
        </button>
      </div>
    </div>
  );
};
