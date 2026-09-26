import React from 'react';
import { 
  X, 
  FileText, 
  Truck, 
  Calendar, 
  Building2, 
  Package,
  Send,
  Ban
} from 'lucide-react';
import type { PurchaseOrder, PurchaseOrderStatus } from '../../types';
import { formatRupiah, formatPurchasingDate } from '../../services/purchasingService';

interface PoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  onReceiveClick: (po: PurchaseOrder) => void;
  onStatusChange: (poId: string, status: PurchaseOrderStatus) => Promise<void>;
  onCancelPo: (poId: string, reason?: string) => Promise<void>;
}

export const PoDetailModal: React.FC<PoDetailModalProps> = ({
  isOpen,
  onClose,
  po,
  onReceiveClick,
  onStatusChange,
  onCancelPo,
}) => {
  if (!isOpen || !po) return null;

  const items = po.items || [];
  const totalOrdered = items.reduce((acc, i) => acc + i.qtyOrdered, 0);
  const totalReceived = items.reduce((acc, i) => acc + i.qtyReceived, 0);
  const totalRemaining = totalOrdered - totalReceived;

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'DRAFT', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
      case 'ORDERED':
        return { label: 'ORDERED (DIPESAN)', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'PARTIALLY_RECEIVED':
        return { label: 'SEBAGIAN DITERIMA', bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
      case 'RECEIVED':
        return { label: 'SELESAI (RECEIVED)', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'CANCELLED':
        return { label: 'DIBATALKAN', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { label: status, bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  const badge = getStatusBadge(po.status);

  const handleOrderNow = async () => {
    if (confirm(`Ubah status PO ${po.poNumber} menjadi ORDERED? Supplier akan dianggap telah menerima pesanan.`)) {
      await onStatusChange(po.id, 'ORDERED');
    }
  };

  const handleCancel = async () => {
    const isPartial = po.status === 'PARTIALLY_RECEIVED';
    const msg = isPartial
      ? `PO ${po.poNumber} telah diterima sebagian (${totalReceived} pcs). Membatalkan PO hanya akan menutup sisa ${totalRemaining} pcs yang belum datang. Stok yang sudah masuk TIDAK akan dihapus. Lanjutkan?`
      : `Yakin ingin membatalkan Purchase Order ${po.poNumber}?`;

    if (confirm(msg)) {
      const reason = prompt('Masukkan alasan pembatalan (opsional):') || undefined;
      await onCancelPo(po.id, reason);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '840px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
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
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="modal-title font-mono" style={{ fontSize: '18px' }}>{po.poNumber}</h2>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                  }}
                >
                  {badge.label}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>
                Dibuat pada {formatPurchasingDate(po.orderDate)}
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Info Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Building2 size={13} />
                <span>Supplier Mitra</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                {po.supplierNameSnapshot}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Calendar size={13} />
                <span>Perkiraan Datang</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                {po.expectedDate ? formatPurchasingDate(po.expectedDate).split(',')[0] : 'Tidak ditentukan'}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Package size={13} />
                <span>Progres Penerimaan</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }} className="font-mono">
                {totalReceived} / {totalOrdered} pcs ({Math.round((totalReceived / (totalOrdered || 1)) * 100)}%)
              </div>
            </div>
          </div>

          {/* Notes if present */}
          {po.notes && (
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
              <strong style={{ color: 'var(--text-bright)' }}>Catatan: </strong>
              {po.notes}
            </div>
          )}

          {/* Items Table */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)', marginBottom: '8px' }}>
              Daftar Barang & Snapshot Nilai Order
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
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Nama Produk</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '80px' }}>Ordered</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '80px' }}>Received</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '80px' }}>Remaining</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '110px' }}>Unit Cost</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '120px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const remaining = item.qtyOrdered - item.qtyReceived;
                    return (
                      <tr
                        key={item.id || idx}
                        style={{
                          borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        }}
                      >
                        <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }} className="font-mono">
                          {item.skuSnapshot}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-bright)' }}>
                          {item.productNameSnapshot}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }} className="font-mono">
                          {item.qtyOrdered}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: item.qtyReceived > 0 ? '#34d399' : 'var(--text-dim)' }} className="font-mono">
                          {item.qtyReceived}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: remaining > 0 ? '#eab308' : 'var(--text-dim)', fontWeight: remaining > 0 ? 700 : 400 }} className="font-mono">
                          {remaining}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-dim)' }} className="font-mono">
                          {formatRupiah(item.unitCost)}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--cyan)' }} className="font-mono">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer with Totals and Actions */}
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
          {/* Total */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Sisa Belum Diterima</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: totalRemaining > 0 ? '#eab308' : '#10b981' }} className="font-mono">
                {totalRemaining} pcs
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total Nilai Purchase Order</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan)' }} className="font-mono">
                {formatRupiah(po.total)}
              </div>
            </div>
          </div>

          {/* Action buttons based on status */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Tutup
            </button>

            {/* Cancel PO (Only if DRAFT, ORDERED, or PARTIALLY_RECEIVED) */}
            {(po.status === 'DRAFT' || po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '8px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Ban size={14} />
                <span>{po.status === 'PARTIALLY_RECEIVED' ? 'Batalkan Sisa PO' : 'Batalkan PO'}</span>
              </button>
            )}

            {/* If DRAFT -> Send Order button */}
            {po.status === 'DRAFT' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOrderNow}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={14} />
                <span>Kirim Order (ORDERED)</span>
              </button>
            )}

            {/* If ORDERED or PARTIALLY_RECEIVED -> Receive Goods button */}
            {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReceiveClick(po);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--cyan)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 15px var(--cyan-glow)',
                }}
              >
                <Truck size={14} />
                <span>Terima Barang (Receive Goods)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
