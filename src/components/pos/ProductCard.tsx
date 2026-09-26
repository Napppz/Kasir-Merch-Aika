import React from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { usePos } from '../../context/PosContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = usePos();
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minimumStock;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product);
    }
  };

  return (
    <div
      className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}
      onClick={handleAdd}
    >
      <div className="product-thumb-wrapper">
        <img src={product.image} alt={product.name} loading="lazy" />
        
        {/* Stock tag badge */}
        {isOutOfStock ? (
          <span className="stock-tag-badge out">🚫 HABIS</span>
        ) : isLowStock ? (
          <span className="stock-tag-badge low">⚠ Tinggal {product.stock}</span>
        ) : (
          <span className="stock-tag-badge ready">{product.stock} Stok</span>
        )}
      </div>

      <div className="product-sku">{product.sku}</div>
      <div className="product-name" title={product.name}>
        {product.name}
      </div>

      <div className={`product-desc ${isLowStock ? 'warning-text' : ''}`}>
        {isLowStock ? '⚠ Stok Menipis!' : product.description}
      </div>

      <div className="product-price-row">
        <div className="product-price">{formatRupiah(product.price, true, false)}</div>
      </div>

      <button
        type="button"
        className="add-product-btn"
        disabled={isOutOfStock}
        onClick={handleAdd}
      >
        {isOutOfStock ? (
          'Stok Habis'
        ) : (
          <>
            <Plus size={13} />
            <span>Tambah</span>
          </>
        )}
      </button>
    </div>
  );
};
