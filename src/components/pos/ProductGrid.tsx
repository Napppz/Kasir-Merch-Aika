import React, { useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import { ProductCard } from './ProductCard';

export const ProductGrid: React.FC = () => {
  const { products, activeCategory, searchQuery } = usePos();

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Must be active
      if (!prod.isActive) return false;

      // Category filter
      const matchesCategory =
        activeCategory === 'all' || prod.categoryId === activeCategory;

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        (prod.description && prod.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.isActive && p.stock > 0 && p.stock <= Math.max(4, p.minimumStock)).length;
  }, [products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Legend & Count Bar */}
      <div className="stock-legend-bar">
        <div>
          Menampilkan <strong style={{ color: 'var(--text-main)' }}>{filteredProducts.length}</strong> Produk Siap Jual
        </div>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-dot ready"></span>
            <span>Ready Stock</span>
          </div>
          <div className="legend-item" style={lowStockCount > 0 ? { color: '#f59e0b', fontWeight: 700 } : undefined}>
            <span className="legend-dot low"></span>
            <span>Stok Menipis {lowStockCount > 0 ? `(${lowStockCount})` : ''}</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot out"></span>
            <span>Habis</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="product-grid-container">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              color: 'var(--text-dim)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '15px' }}>
              Tidak ada produk yang cocok
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Coba kata kunci lain atau pilih kategori "Semua"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
