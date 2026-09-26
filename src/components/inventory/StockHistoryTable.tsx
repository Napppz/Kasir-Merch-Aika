import React, { useState } from 'react';
import { Search, Eye, Filter } from 'lucide-react';
import type { StockMovement, Product } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface StockHistoryTableProps {
  movements: StockMovement[];
  products: Product[];
  onSelectMovement: (movement: StockMovement) => void;
  filterProductId?: string;
}

export const StockHistoryTable: React.FC<StockHistoryTableProps> = ({
  movements,
  products,
  onSelectMovement,
  filterProductId,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredMovements = movements.filter(m => {
    if (filterProductId && m.productId !== filterProductId) return false;

    // Movement type filter
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'STOCK_IN' && m.type !== 'STOCK_IN') return false;
      if (typeFilter === 'SALE' && m.type !== 'SALE') return false;
      if (typeFilter === 'ADJUSTMENT' && !['ADJUSTMENT_IN', 'ADJUSTMENT_OUT'].includes(m.type)) return false;
      if (typeFilter === 'DAMAGE_LOST' && !['DAMAGE', 'LOST'].includes(m.type)) return false;
      if (typeFilter === 'OPNAME' && !['OPNAME_IN', 'OPNAME_OUT'].includes(m.type)) return false;
    }

    // Search query filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const product = products.find(p => p.id === m.productId);
      const prodName = product ? product.name.toLowerCase() : '';
      const prodSku = product ? product.sku.toLowerCase() : '';
      const reason = m.reason.toLowerCase();
      const note = (m.note || '').toLowerCase();
      const refId = (m.referenceId || '').toLowerCase();

      return (
        prodName.includes(q) ||
        prodSku.includes(q) ||
        reason.includes(q) ||
        note.includes(q) ||
        refId.includes(q)
      );
    }

    return true;
  });

  const getTypeBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'INITIAL':
        return { label: 'INITIAL', bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
      case 'STOCK_IN':
        return { label: 'STOCK IN', bg: 'var(--cyan-bg)', color: 'var(--cyan)', border: 'var(--border-cyan)' };
      case 'SALE':
        return { label: 'SALE (POS)', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'ADJUSTMENT_IN':
        return { label: 'ADJUST (+)', bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      case 'ADJUSTMENT_OUT':
        return { label: 'ADJUST (-)', bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
      case 'DAMAGE':
        return { label: 'RUSAK', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'LOST':
        return { label: 'HILANG', bg: 'rgba(225, 29, 72, 0.15)', color: '#fb7185', border: 'rgba(225, 29, 72, 0.3)' };
      case 'OPNAME_IN':
        return { label: 'OPNAME (+)', bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      case 'OPNAME_OUT':
        return { label: 'OPNAME (-)', bg: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
      default:
        return { label: type, bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'var(--border-subtle)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      {/* Search & Filter Toolbar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: '220px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 12px',
          }}
        >
          <Search size={14} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Cari pergerakan (produk, SKU, alasan, no invoice)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Filter size={13} color="var(--text-dim)" />
          {[
            { id: 'ALL', label: 'Semua Tipe' },
            { id: 'STOCK_IN', label: 'Stock In' },
            { id: 'SALE', label: 'Penjualan (POS)' },
            { id: 'ADJUSTMENT', label: 'Penyesuaian' },
            { id: 'DAMAGE_LOST', label: 'Rusak / Hilang' },
            { id: 'OPNAME', label: 'Opname' },
          ].map(f => (
            <button
              type="button"
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              style={{
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: typeFilter === f.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: typeFilter === f.id ? '#a5b4fc' : 'var(--text-secondary)',
                border: `1px solid ${typeFilter === f.id ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-subtle)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="data-table-wrapper"
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
        }}
      >
        {filteredMovements.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
            Belum ada catatan pergerakan stok yang cocok.
          </div>
        ) : (
          <table className="cosplay-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ width: '130px' }}>Waktu & Tanggal</th>
                <th>Merchandise</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Tipe</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Jumlah</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Stok Berubah</th>
                <th>Alasan & Catatan</th>
                <th style={{ width: '120px' }}>No. Referensi</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(m => {
                const product = products.find(p => p.id === m.productId);
                const badge = getTypeBadge(m.type);
                const isPositive = ['INITIAL', 'STOCK_IN', 'ADJUSTMENT_IN', 'OPNAME_IN'].includes(m.type);

                return (
                  <tr
                    key={m.id}
                    onClick={() => onSelectMovement(m)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDateTime(m.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {product?.image && (
                          <img
                            src={product.image}
                            alt=""
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                              background: '#040810',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div>
                          <span className="inv-code" style={{ fontSize: '10px' }}>
                            {product?.sku || '-'}
                          </span>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '12px' }}>
                            {product?.name || m.productId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: isPositive ? 'var(--cyan)' : '#f43f5e',
                        }}
                      >
                        {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{m.stockBefore}</span>
                      <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>→</span>
                      <strong style={{ fontSize: '12px', color: '#ffffff' }}>{m.stockAfter}</strong>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {m.reason}
                      </div>
                      {m.note && (
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {m.note}
                        </div>
                      )}
                    </td>
                    <td>
                      {m.referenceId ? (
                        <span
                          className="inv-code"
                          style={{
                            fontSize: '10px',
                            color: 'var(--cyan)',
                            background: 'var(--cyan-bg)',
                            padding: '1px 5px',
                            borderRadius: '3px',
                          }}
                        >
                          {m.referenceId}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onSelectMovement(m);
                        }}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                        }}
                      >
                        <Eye size={12} />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
