import React from 'react';
import { X, Calendar, User, Hash, Info, FileText } from 'lucide-react';
import type { StockMovement, Product } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface MovementDetailDrawerProps {
  movement: StockMovement | null;
  product?: Product;
  onClose: () => void;
}

export const MovementDetailDrawer: React.FC<MovementDetailDrawerProps> = ({
  movement,
  product,
  onClose,
}) => {
  if (!movement) return null;

  const isPositive = [
    'INITIAL',
    'STOCK_IN',
    'ADJUSTMENT_IN',
    'OPNAME_IN',
  ].includes(movement.type);

  const getTypeBadge = () => {
    switch (movement.type) {
      case 'INITIAL':
        return { label: 'INITIAL STOCK', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
      case 'STOCK_IN':
        return { label: 'STOCK IN', bg: 'var(--cyan-bg)', color: 'var(--cyan)', border: 'var(--border-cyan)' };
      case 'SALE':
        return { label: 'SALE (POS)', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'ADJUSTMENT_IN':
        return { label: 'ADJUSTMENT (+)', bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      case 'ADJUSTMENT_OUT':
        return { label: 'ADJUSTMENT (-)', bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
      case 'DAMAGE':
        return { label: 'DAMAGE / RUSAK', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'LOST':
        return { label: 'LOST / HILANG', bg: 'rgba(225, 29, 72, 0.15)', color: '#fb7185', border: 'rgba(225, 29, 72, 0.3)' };
      case 'OPNAME_IN':
        return { label: 'OPNAME (SURPLUS)', bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      case 'OPNAME_OUT':
        return { label: 'OPNAME (DEFISIT)', bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
      default:
        return { label: movement.type, bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'var(--border-subtle)' };
    }
  };

  const badge = getTypeBadge();
  const productName = product ? product.name : 'Merchandise ID: ' + movement.productId;
  const productSku = product ? product.sku : '-';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '420px',
          maxWidth: '92vw',
          height: '100%',
          background: '#0b1220',
          borderLeft: '1px solid var(--border-muted)',
          boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 180ms ease-out',
        }}
        onClick={e => e.stopPropagation()}
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
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.8px' }}>
              DETAIL PERGERAKAN STOK
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
          {/* Main Visual Banner */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.border}`,
                }}
              >
                {badge.label}
              </span>

              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  fontFamily: 'var(--font-mono)',
                  color: isPositive ? 'var(--cyan)' : '#f43f5e',
                }}
              >
                {isPositive ? `+${movement.quantity}` : `-${movement.quantity}`} <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>pcs</span>
              </div>
            </div>

            <div>
              <span className="inv-code" style={{ fontSize: '11px' }}>{productSku}</span>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginTop: '2px', lineHeight: 1.3 }}>
                {productName}
              </h3>
            </div>
          </div>

          {/* Before & After Stock */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Stok Sebelum</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                {movement.stockBefore} pcs
              </div>
            </div>

            <div style={{ fontSize: '16px', color: 'var(--text-dim)', fontWeight: 800 }}>
              →
            </div>

            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Stok Sesudah</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: isPositive ? 'var(--cyan)' : '#34d399', marginTop: '2px' }}>
                {movement.stockAfter} pcs
              </div>
            </div>
          </div>

          {/* Details Metadata List */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Info size={15} color="var(--primary-light)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Alasan (Reason):</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {movement.reason}
                </div>
              </div>
            </div>

            {movement.note && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <FileText size={15} color="var(--primary-light)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Catatan Tambahan:</span>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {movement.note}
                  </div>
                </div>
              </div>
            )}

            {movement.referenceId && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Hash size={15} color="var(--cyan)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>No. Referensi / Transaksi:</span>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--cyan)' }}>
                    {movement.referenceId}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Calendar size={15} color="var(--text-dim)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Waktu Pencatatan:</span>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {formatDateTime(movement.createdAt)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <User size={15} color="var(--text-dim)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Operator / Kasir:</span>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {movement.createdBy}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '9px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-muted)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tutup (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
