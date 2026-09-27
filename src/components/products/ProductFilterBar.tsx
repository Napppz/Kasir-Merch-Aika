import React from 'react';
import { Search, RotateCcw, ArrowUpDown, Filter } from 'lucide-react';
import type { Category } from '../../types';

export interface ProductFilters {
  search: string;
  categoryId: string;
  status: 'all' | 'active' | 'inactive';
  stockStatus: 'all' | 'ready' | 'low' | 'out';
  sortBy: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'updated-desc';
}

interface ProductFilterBarProps {
  filters: ProductFilters;
  categories: Category[];
  onChange: (filters: ProductFilters) => void;
  onReset: () => void;
  totalFiltered: number;
  totalAll: number;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  filters,
  categories,
  onChange,
  onReset,
  totalFiltered,
  totalAll,
}) => {
  const isFilterActive =
    filters.search !== '' ||
    filters.categoryId !== 'all' ||
    filters.status !== 'all' ||
    filters.stockStatus !== 'all' ||
    filters.sortBy !== 'updated-desc';

  return (
    <div
      className="product-filter-bar-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '14px 16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        {/* Real-time Search */}
        <div
          className="search-input-wrapper"
          style={{ flex: '1 1 240px', minWidth: '220px', padding: '6px 12px' }}
        >
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Cari nama produk atau SKU..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            style={{ width: '100%', fontSize: '12px' }}
          />
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            style={{
              background: '#090d16',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            value={filters.categoryId}
            onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
          >
            <option value="all">Semua Kategori</option>
            {categories
              .filter((c) => c.id !== 'all')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {!c.isActive ? '(Nonaktif)' : ''}
                </option>
              ))}
          </select>
        </div>

        {/* Product Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            style={{
              background: '#090d16',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            value={filters.status}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as ProductFilters['status'],
              })
            }
          >
            <option value="all">Semua Status Produk</option>
            <option value="active">Aktif (Dijual di POS)</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {/* Stock Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            style={{
              background: '#090d16',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            value={filters.stockStatus}
            onChange={(e) =>
              onChange({
                ...filters,
                stockStatus: e.target.value as ProductFilters['stockStatus'],
              })
            }
          >
            <option value="all">Semua Status Stok</option>
            <option value="ready">Ready Stock</option>
            <option value="low">Stok Menipis (Low)</option>
            <option value="out">Habis (Out of Stock)</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <ArrowUpDown size={14} color="var(--text-dim)" />
          <select
            style={{
              background: '#090d16',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            value={filters.sortBy}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as ProductFilters['sortBy'],
              })
            }
          >
            <option value="updated-desc">Terbaru Diubah</option>
            <option value="name-asc">Nama A-Z</option>
            <option value="name-desc">Nama Z-A</option>
            <option value="price-asc">Harga Terendah</option>
            <option value="price-desc">Harga Tertinggi</option>
            <option value="stock-asc">Stok Terendah</option>
            <option value="stock-desc">Stok Tertinggi</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {isFilterActive && (
          <button
            type="button"
            onClick={onReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: '#f87171',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* Filter Info Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-dim)',
          borderTop: '1px solid rgba(255, 255, 255, 0.03)',
          paddingTop: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={12} color="var(--primary-light)" />
          <span>
            Menampilkan <strong style={{ color: 'var(--text-main)' }}>{totalFiltered}</strong> dari{' '}
            <strong>{totalAll}</strong> produk
          </span>
        </div>

        {isFilterActive && (
          <span style={{ color: 'var(--cyan)' }}>Filter aktif diterapkan</span>
        )}
      </div>
    </div>
  );
};
