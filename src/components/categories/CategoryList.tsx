import React from 'react';
import { Edit3, Power, Trash2, FolderPlus, Layers } from 'lucide-react';
import type { Category, Product } from '../../types';

interface CategoryListProps {
  categories: Category[];
  products: Product[];
  onAddNew: () => void;
  onEdit: (category: Category) => void;
  onToggleStatus: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  products,
  onAddNew,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  // Exclude virtual 'all' category from management list
  const manageableCategories = categories.filter((c) => c.id !== 'all');

  const getProductCount = (catId: string) => {
    return products.filter((p) => p.categoryId === catId).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Banner / Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--primary-light)" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
              Daftar Kategori Merchandise
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Total {manageableCategories.length} kategori terdaftar di sistem
            </div>
          </div>
        </div>

        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: 'var(--primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 10px var(--primary-glow)',
          }}
          onClick={onAddNew}
        >
          <FolderPlus size={14} />
          <span>+ Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Categories Table */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <div className="data-table-wrapper">
          <table className="cosplay-table">
            <thead>
              <tr>
                <th>NAMA KATEGORI</th>
                <th>DESKRIPSI</th>
                <th>JUMLAH PRODUK</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {manageableCategories.map((cat) => {
                const count = getProductCount(cat.id);
                return (
                  <tr
                    key={cat.id}
                    style={{
                      opacity: cat.isActive ? 1 : 0.65,
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 800, color: '#ffffff' }}>{cat.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        ID: {cat.id}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {cat.description || '-'}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: count > 0 ? 'var(--cyan-bg)' : 'rgba(255, 255, 255, 0.04)',
                          color: count > 0 ? 'var(--cyan)' : 'var(--text-dim)',
                        }}
                      >
                        {count} Produk
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: cat.isActive
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          color: cat.isActive ? '#34d399' : '#f87171',
                        }}
                      >
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '5px' }}>
                        {/* Edit */}
                        <button
                          type="button"
                          className="table-detail-btn"
                          onClick={() => onEdit(cat)}
                          title="Edit Kategori"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>

                        {/* Toggle Status */}
                        <button
                          type="button"
                          className="table-detail-btn"
                          style={{
                            color: cat.isActive ? '#f87171' : '#34d399',
                            borderColor: cat.isActive
                              ? 'rgba(239, 68, 68, 0.3)'
                              : 'rgba(16, 185, 129, 0.3)',
                          }}
                          onClick={() => onToggleStatus(cat)}
                          title={cat.isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}
                        >
                          <Power size={12} />
                          <span>{cat.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          className="table-detail-btn"
                          style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          onClick={() => onDelete(cat)}
                          title="Hapus Kategori (Hanya jika belum memiliki produk)"
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
