import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  AlertTriangle, 
  Sparkles 
} from 'lucide-react';
import type { PurchaseOrder } from '../../types';
import { formatRupiah } from '../../services/purchasingService';

interface ReceiveGoodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
  cashierName: string;
  onConfirmReceiving: (params: {
    purchaseOrderId: string;
    receivedBy: string;
    notes?: string;
    items: { productId: string; qtyReceivedNow: number; actualUnitCost?: number }[];
  }) => Promise<{ success: boolean; error?: string }>;
}

interface ItemReceiveRow {
  productId: string;
  sku: string;
  name: string;
  qtyOrdered: number;
  qtyPreviouslyReceived: number;
  remaining: number;
  qtyReceiveNow: number;
  unitCost: number;
}

export const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({
  isOpen,
  onClose,
  po,
  cashierName,
  onConfirmReceiving,
}) => {
  const [rows, setRows] = useState<ItemReceiveRow[]>([]);
  const [operatorName, setOperatorName] = useState<string>(cashierName || 'Operator Kasir');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (po && po.items) {
      setRows(
        po.items.map(item => {
          const remaining = Math.max(0, item.qtyOrdered - item.qtyReceived);
          return {
            productId: item.productId,
            sku: item.skuSnapshot,
            name: item.productNameSnapshot,
            qtyOrdered: item.qtyOrdered,
            qtyPreviouslyReceived: item.qtyReceived,
            remaining,
            qtyReceiveNow: remaining, // default to remaining
            unitCost: item.unitCost,
          };
        })
      );
      setOperatorName(cashierName || 'Operator Kasir');
      setNotes('');
      setErrorMessage('');
    }
  }, [po, cashierName, isOpen]);

  if (!isOpen || !po) return null;

  const handleQtyChange = (index: number, val: number) => {
    const updated = [...rows];
    const row = updated[index];
    const cleanVal = isNaN(val) ? 0 : val;

    if (cleanVal < 0) {
      setErrorMessage('Kuantitas yang diterima tidak boleh bernilai negatif.');
      return;
    }

    if (cleanVal > row.remaining) {
      setErrorMessage(
        `Kuantitas tidak boleh melebihi sisa yang belum diterima (${row.remaining} pcs untuk produk ${row.name}).`
      );
      return;
    }

    setErrorMessage('');
    row.qtyReceiveNow = cleanVal;
    setRows(updated);
  };

  const handleCostChange = (index: number, val: number) => {
    const updated = [...rows];
    updated[index].unitCost = Math.max(0, isNaN(val) ? 0 : val);
    setRows(updated);
  };

  const handleReceiveAll = () => {
    setErrorMessage('');
    setRows(prev =>
      prev.map(r => ({
        ...r,
        qtyReceiveNow: r.remaining,
      }))
    );
  };

  const handleResetToZero = () => {
    setErrorMessage('');
    setRows(prev =>
      prev.map(r => ({
        ...r,
        qtyReceiveNow: 0,
      }))
    );
  };

  const totalReceiveNow = rows.reduce((sum, r) => sum + r.qtyReceiveNow, 0);
  const totalCostNow = rows.reduce((sum, r) => sum + (r.qtyReceiveNow * r.unitCost), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (totalReceiveNow <= 0) {
      setErrorMessage('Masukkan jumlah barang yang diterima (minimal 1 unit pada salah satu produk).');
      return;
    }

    // Strict validation (Requirement 15)
    for (const r of rows) {
      if (r.qtyReceiveNow < 0) {
        setErrorMessage(`Kuantitas tidak boleh negatif (${r.name}).`);
        return;
      }
      if (r.qtyReceiveNow > r.remaining) {
        setErrorMessage(`Kuantitas (${r.qtyReceiveNow}) melebihi sisa (${r.remaining}) untuk produk ${r.name}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const itemsToReceive = rows
        .filter(r => r.qtyReceiveNow > 0)
        .map(r => ({
          productId: r.productId,
          qtyReceivedNow: r.qtyReceiveNow,
          actualUnitCost: r.unitCost,
        }));

      const res = await onConfirmReceiving({
        purchaseOrderId: po.id,
        receivedBy: operatorName.trim() || 'Operator Kasir',
        notes: notes.trim() || undefined,
        items: itemsToReceive,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Gagal memproses penerimaan barang.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat penerimaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '860px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
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
              <Truck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="modal-title font-mono" style={{ fontSize: '18px' }}>
                  Penerimaan Barang • {po.poNumber}
                </h2>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>
                Supplier: <strong style={{ color: 'var(--text-bright)' }}>{po.supplierNameSnapshot}</strong> • Stok akan otomatis bertambah ke sistem
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              margin: '12px 20px 0 20px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* Body */}
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick action buttons & instruction */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-card)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-muted)',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Masukkan kuantitas fisik merchandise yang tiba di booth convention.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleReceiveAll}
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--cyan)',
                    border: '1px solid var(--border-cyan)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={13} />
                  <span>Terima Semua Sisa</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToZero}
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-dim)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Reset ke 0
                </button>
              </div>
            </div>

            {/* Table */}
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
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', width: '80px' }}>SKU</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Nama Produk</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '70px' }}>Ordered</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '70px' }}>Received</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '75px' }}>Sisa</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '110px' }}>Terima Sekarang</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '120px' }}>Harga Modal Aktual</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', textAlign: 'right', width: '110px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const rowSubtotal = row.qtyReceiveNow * row.unitCost;
                    const isFullyReceived = row.remaining === 0;

                    return (
                      <tr
                        key={row.productId}
                        style={{
                          borderBottom: idx < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          background: isFullyReceived ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                          opacity: isFullyReceived ? 0.6 : 1,
                        }}
                      >
                        <td style={{ padding: '8px 12px', color: 'var(--text-dim)' }} className="font-mono">
                          {row.sku}
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-bright)' }}>
                          {row.name}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }} className="font-mono">
                          {row.qtyOrdered}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#34d399' }} className="font-mono">
                          {row.qtyPreviouslyReceived}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: row.remaining > 0 ? '#eab308' : 'var(--text-dim)', fontWeight: 700 }} className="font-mono">
                          {row.remaining}
                        </td>

                        {/* Receive Now Input */}
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min="0"
                            max={row.remaining}
                            disabled={isFullyReceived}
                            className="input-field font-mono"
                            value={row.qtyReceiveNow}
                            onChange={e => handleQtyChange(idx, parseInt(e.target.value, 10))}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              fontSize: '12px',
                              textAlign: 'right',
                              background: row.qtyReceiveNow > 0 ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-surface)',
                              borderColor: row.qtyReceiveNow > 0 ? 'var(--cyan)' : 'var(--border-muted)',
                              color: row.qtyReceiveNow > 0 ? 'var(--cyan)' : 'var(--text-dim)',
                              fontWeight: row.qtyReceiveNow > 0 ? 700 : 400,
                            }}
                          />
                        </td>

                        {/* Actual Unit Cost Input */}
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            disabled={isFullyReceived}
                            className="input-field font-mono"
                            value={row.unitCost}
                            onChange={e => handleCostChange(idx, parseFloat(e.target.value))}
                            style={{ width: '100%', padding: '6px 8px', fontSize: '12px', textAlign: 'right' }}
                          />
                        </td>

                        {/* Subtotal */}
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--cyan)' }} className="font-mono">
                          {formatRupiah(rowSubtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Operator and Notes Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Petugas Penerima (Operator Booth) <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={operatorName}
                  onChange={e => setOperatorName(e.target.value)}
                  placeholder="Nama Kasir / Staff Gudang"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Nomor Surat Jalan / Resi / Catatan Penerimaan
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Contoh: No Surat Jalan SJ-2026/09/27-01, barang kondisi utuh dan bagus"
                />
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
            {/* Live Summary */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total Diterima Sekarang</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: totalReceiveNow > 0 ? '#34d399' : 'var(--text-dim)' }} className="font-mono">
                  +{totalReceiveNow} pcs
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total Nilai Masuk</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan)' }} className="font-mono">
                  {formatRupiah(totalCostNow)}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || totalReceiveNow <= 0}
                style={{
                  minWidth: '200px',
                  boxShadow: '0 0 15px var(--cyan-glow)',
                  background: 'var(--cyan)',
                  color: '#000000',
                  fontWeight: 800,
                }}
              >
                {isSubmitting ? 'Memproses Stock In...' : `Konfirmasi Terima (+${totalReceiveNow} pcs)`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
