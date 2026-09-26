import React, { useState } from 'react';
import { 
  X, 
  Edit3, 
  Power, 
  Calendar, 
  Tag, 
  MapPin, 
  Sparkles,
  SlidersHorizontal,
  History
} from 'lucide-react';
import type { Product, Category } from '../../types';
import { calculateMargin, getStockBadgeInfo } from '../../utils/productHelpers';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { usePos } from '../../context/PosContext';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';

interface ProductDetailDrawerProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onEdit: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  categories,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  const { getLastProductMovement, setCurrentPage } = usePos();
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);

  if (!product) return null;

  const lastMovement = getLastProductMovement(product.id);
  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Kategori Tidak Diketahui';
  const margin = calculateMargin(product.price, product.costPrice);
  const stockBadge = getStockBadgeInfo(product);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '440px',
          maxWidth: '92vw',
          height: '100%',
          background: '#0b1220',
          borderLeft: '1px solid var(--border-muted)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.8px' }}>
              DETAIL MERCHANDISE
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: product.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: product.isActive ? '#34d399' : '#f87171',
              }}
            >
              {product.isActive ? '● Aktif di POS' : '○ Nonaktif'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--text-dim)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Visual & Titles */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: '#080d16',
                border: '1px solid var(--border-muted)',
                flexShrink: 0,
              }}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: 'var(--cyan)',
                  background: 'var(--cyan-bg)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}
              >
                {product.sku}
              </span>

              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginTop: '6px', lineHeight: 1.2 }}>
                {product.name}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <Tag size={12} />
                <span>{categoryName}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Profit Margin Box */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.6px' }}>
              INFORMASI HARGA & LABA
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Harga Jual:</span>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff' }}>
                  {formatRupiah(product.price, true, false)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Harga Modal (HPP):</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {formatRupiah(product.costPrice, true, false)}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '4px',
                paddingTop: '8px',
                borderTop: '1px dashed var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--cyan)' }}>
                <Sparkles size={13} />
                <span>Estimasi Margin Laba:</span>
              </div>
              <strong style={{ fontSize: '13px', color: '#38bdf8' }}>
                {formatRupiah(margin.nominal, true, false)} ({margin.percentage}%)
              </strong>
            </div>
          </div>

          {/* Stock & Inventory Box */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.6px' }}>
              STATUS STOK DI BOOTH
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Stok Tersedia:</span>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>
                  {product.stock} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>pcs</span>
                </div>
              </div>

              <span className={`stock-tag-badge ${stockBadge.className}`} style={{ position: 'static' }}>
                {stockBadge.label}
              </span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Batas minimum alert: <strong style={{ color: 'var(--text-secondary)' }}>{product.minimumStock} pcs</strong>
            </div>

            {product.locationNote && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                }}
              >
                <MapPin size={13} color="var(--primary-light)" />
                <span>Lokasi simpan: {product.locationNote}</span>
              </div>
            )}

            {/* Last Stock Movement (BAGIAN 15) */}
            <div
              style={{
                marginTop: '4px',
                paddingTop: '8px',
                borderTop: '1px dashed var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-dim)' }}>Pergerakan Stok Terakhir:</span>
                {lastMovement ? (
                  <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>
                    {lastMovement.type} ({lastMovement.stockBefore} → {lastMovement.stockAfter})
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-dim)' }}>Belum ada histori</span>
                )}
              </div>
              {lastMovement && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {formatDateTime(lastMovement.createdAt)} • {lastMovement.reason}
                </div>
              )}
            </div>

            {/* Quick Stock Buttons (BAGIAN 15) */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(true)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f43f5e',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={13} />
                <span>Stock Adjustment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCurrentPage('inventory');
                }}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                }}
              >
                <History size={13} />
                <span>View Stock History</span>
              </button>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.6px', marginBottom: '6px' }}>
                DESKRIPSI PRODUK
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {product.description}
              </p>
            </div>
          )}

          {/* Audit Timestamps */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              fontSize: '10px',
              color: 'var(--text-dim)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={11} />
              <span>Dibuat: {formatDateTime(product.createdAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={11} />
              <span>Terakhir Diubah: {formatDateTime(product.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            gap: '10px',
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '9px 14px',
              background: 'var(--primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={() => onEdit(product)}
          >
            <Edit3 size={14} />
            <span>Edit Produk</span>
          </button>

          <button
            type="button"
            style={{
              padding: '9px 14px',
              background: product.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${product.isActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 700,
              color: product.isActive ? '#f87171' : '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => onToggleStatus(product)}
          >
            <Power size={14} />
            <span>{product.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
          </button>
        </div>
      </div>

      {/* Stock Adjustment Modal launched from Product Detail (BAGIAN 15) */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        preselectedProductId={product.id}
      />
    </div>
  );
};
