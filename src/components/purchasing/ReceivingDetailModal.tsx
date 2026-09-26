import React from 'react';
import { X, CheckCircle2, Building2, Calendar, User } from 'lucide-react';
import type { ReceivingRecord } from '../../types';
import { formatRupiah, formatPurchasingDate } from '../../services/purchasingService';

interface ReceivingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ReceivingRecord | null;
}

export const ReceivingDetailModal: React.FC<ReceivingDetailModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '750px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="modal-title font-mono" style={{ fontSize: '18px' }}>
                  {record.receivingNumber}
                </h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  SELESAI (COMPLETED)
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>
                Penerimaan fisik barang atas referensi PO <strong className="font-mono" style={{ color: 'var(--text-bright)' }}>{record.poNumber}</strong>
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Metadata Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <div style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Building2 size={13} />
                <span>Supplier</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-bright)' }}>
                {record.supplierName}
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Calendar size={13} />
                <span>Waktu Diterima</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-bright)' }}>
                {formatPurchasingDate(record.receivedAt)}
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <User size={13} />
                <span>Petugas Penerima</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-bright)' }}>
                {record.receivedBy}
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {record.notes && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                color: 'var(--text-dim)',
              }}
            >
              <strong style={{ color: 'var(--text-bright)' }}>Catatan / Resi: </strong>
              {record.notes}
            </div>
          )}

          {/* Items Table */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '8px' }}>
              Rincian Barang yang Diterima ({record.items.length} jenis)
            </div>
            <div
              style={{
                border: '1px solid var(--border-muted)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--bg-surface)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', width: '90px' }}>SKU</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Nama Produk (Snapshot)</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '90px' }}>Diterima</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '120px' }}>Harga Modal</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '130px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {record.items.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: idx < record.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }} className="font-mono">
                        {item.skuSnapshot}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-bright)' }}>
                        {item.productNameSnapshot}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#34d399', fontWeight: 700 }} className="font-mono">
                        +{item.qtyReceivedNow} pcs
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-dim)' }} className="font-mono">
                        {formatRupiah(item.actualUnitCost)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--cyan)' }} className="font-mono">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border-muted)',
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total Fisik Diterima</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#34d399' }} className="font-mono">
                {record.totalQuantity} pcs
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total Nilai Masuk</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan)' }} className="font-mono">
                {formatRupiah(record.totalCost)}
              </div>
            </div>
          </div>

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
