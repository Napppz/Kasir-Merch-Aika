import React from 'react';
import { Eye, Edit3, Power, PackagePlus } from 'lucide-react';
import type { Product, Category } from '../../types';
import { getStockBadgeInfo } from '../../utils/productHelpers';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  onViewDetail: (product: Product) => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onAddNew: () => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  categories,
  onViewDetail,
  onEdit,
  onToggleStatus,
  onAddNew,
}) => {
  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || catId;
  };

  if (products.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '38px' }}>📦</div>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
          Tidak ada produk yang cocok
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '320px' }}>
          Sesuaikan pencarian atau filter yang Anda terapkan, atau tambahkan merchandise baru ke booth.
        </p>
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'var(--primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 700,
            marginTop: '6px',
            cursor: 'pointer',
          }}
          onClick={onAddNew}
        >
          <PackagePlus size={15} />
          <span>+ Tambah Produk Baru</span>
        </button>
      </div>
    );
  }

  return (
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
              <th>FOTO & NAMA MERCHANDISE</th>
              <th>SKU</th>
              <th>KATEGORI</th>
              <th>HARGA JUAL</th>
              <th>HARGA MODAL</th>
              <th>STOK BOOTH</th>
              <th>STATUS</th>
              <th>TERAKHIR DIUBAH</th>
              <th style={{ textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockBadge = getStockBadgeInfo(product);

              return (
                <tr
                  key={product.id}
                  style={{
                    opacity: product.isActive ? 1 : 0.65,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {/* Photo & Name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: '#080d16',
                          flexShrink: 0,
                        }}
                      >
                        {product.image && (
                          <img
                            src={product.image}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: product.isActive ? 'var(--text-main)' : 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '220px',
                          }}
                          title={product.name}
                        >
                          {product.name}
                        </div>
                        {product.description && (
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'var(--text-dim)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '220px',
                            }}
                          >
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* SKU */}
                  <td>
                    <span className="inv-code" style={{ color: 'var(--cyan)' }}>
                      {product.sku}
                    </span>
                  </td>

                  {/* Category */}
                  <td>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {getCategoryName(product.categoryId)}
                    </span>
                  </td>

                  {/* Price */}
                  <td>
                    <strong style={{ color: '#ffffff' }}>
                      {formatRupiah(product.price, true, false)}
                    </strong>
                  </td>

                  {/* Cost Price */}
                  <td>
                    <span style={{ color: 'var(--text-dim)' }}>
                      {formatRupiah(product.costPrice, true, false)}
                    </span>
                  </td>

                  {/* Stock & Stock Status Badge */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#ffffff' }}>{product.stock}</strong>
                      <span
                        className={`stock-tag-badge ${stockBadge.className}`}
                        style={{ position: 'static', padding: '1px 6px', fontSize: '9px' }}
                      >
                        {stockBadge.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Min: {product.minimumStock}
                    </div>
                  </td>

                  {/* Product Status */}
                  <td>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: product.isActive
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(239, 68, 68, 0.15)',
                        color: product.isActive ? '#34d399' : '#f87171',
                      }}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Updated At */}
                  <td>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {formatDateTime(product.updatedAt).split(',')[0]}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '5px' }}>
                      {/* View Detail */}
                      <button
                        type="button"
                        className="table-detail-btn"
                        onClick={() => onViewDetail(product)}
                        title="Lihat Detail Produk"
                      >
                        <Eye size={12} />
                        <span>Detail</span>
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        className="table-detail-btn"
                        onClick={() => onEdit(product)}
                        title="Edit Produk"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>

                      {/* Activate / Deactivate */}
                      <button
                        type="button"
                        className="table-detail-btn"
                        style={{
                          color: product.isActive ? '#f87171' : '#34d399',
                          borderColor: product.isActive
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(16, 185, 129, 0.3)',
                        }}
                        onClick={() => onToggleStatus(product)}
                        title={product.isActive ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}
                      >
                        <Power size={12} />
                        <span>{product.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
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
  );
};
