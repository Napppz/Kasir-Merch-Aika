import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import type { Supplier, Product, PurchaseOrderStatus } from '../../types';
import { formatRupiah } from '../../services/purchasingService';

interface CreatePoModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onSubmit: (poData: {
    supplierId: string;
    expectedDate?: string;
    notes?: string;
    status: PurchaseOrderStatus;
    items: { productId: string; qtyOrdered: number; unitCost: number }[];
  }) => Promise<{ success: boolean; error?: string }>;
}

interface SelectedItemRow {
  productId: string;
  qtyOrdered: number;
  unitCost: number;
}

export const CreatePoModal: React.FC<CreatePoModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onSubmit,
}) => {
  const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE');

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    activeSuppliers.length > 0 ? activeSuppliers[0].id : ''
  );
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<SelectedItemRow[]>([
    {
      productId: products.length > 0 ? products[0].id : '',
      qtyOrdered: 10,
      unitCost: products.length > 0 ? products[0].costPrice : 0,
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find(p => p.id === newProductId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: newProductId,
      unitCost: prod ? prod.costPrice : 0,
    };
    setItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].qtyOrdered = Math.max(1, qty || 1);
    setItems(updated);
  };

  const handleCostChange = (index: number, cost: number) => {
    const updated = [...items];
    updated[index].unitCost = Math.max(0, cost || 0);
    setItems(updated);
  };

  const handleAddItem = () => {
    // pick first product not yet in items, or first product
    const unusedProd = products.find(p => !items.some(it => it.productId === p.id)) || products[0];
    if (unusedProd) {
      setItems(prev => [
        ...prev,
        {
          productId: unusedProd.id,
          qtyOrdered: 5,
          unitCost: unusedProd.costPrice,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMessage('Purchase Order harus memiliki minimal 1 item.');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const totalCalculated = items.reduce((sum, item) => sum + (item.qtyOrdered * item.unitCost), 0);
  const totalQtyCalculated = items.reduce((sum, item) => sum + item.qtyOrdered, 0);

  const handleSave = async (targetStatus: PurchaseOrderStatus) => {
    setErrorMessage('');

    if (!selectedSupplierId) {
      setErrorMessage('Silakan pilih supplier aktif terlebih dahulu.');
      return;
    }

    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup || sup.status === 'INACTIVE') {
      setErrorMessage('Supplier berstatus INACTIVE tidak dapat dipilih untuk PO baru.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('PO harus memiliki minimal 1 produk.');
      return;
    }

    for (const it of items) {
      if (!it.productId) {
        setErrorMessage('Ada produk yang belum dipilih.');
        return;
      }
      if (it.qtyOrdered <= 0) {
        setErrorMessage('Kuantitas pesanan harus lebih besar dari 0.');
        return;
      }
      if (it.unitCost < 0) {
        setErrorMessage('Harga satuan modal tidak boleh bernilai negatif.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await onSubmit({
        supplierId: selectedSupplierId,
        expectedDate: expectedDate || undefined,
        notes: notes.trim() || undefined,
        status: targetStatus,
        items,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan Purchase Order.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        style={{ maxWidth: '820px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingCart size={20} />
            </div>
            <div>
              <h2 className="modal-title">Buat Purchase Order Baru</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>
                Pesan stok merchandise ke supplier mitra dengan pencatatan snapshot harga modal
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
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Form Grid: Supplier, Expected Date, Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Pilih Supplier Mitra <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              {activeSuppliers.length === 0 ? (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', fontSize: '12px' }}>
                  Tidak ada supplier aktif. Silakan tambahkan atau aktifkan supplier terlebih dahulu.
                </div>
              ) : (
                <select
                  className="input-field"
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-card)' }}
                >
                  {activeSuppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Perkiraan Barang Datang (Expected Date)
              </label>
              <input
                type="date"
                className="input-field"
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Catatan Order / Instruksi Khusus
            </label>
            <input
              type="text"
              className="input-field"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Pengiriman batch 1 untuk persiapan Comic Frontier Day 1..."
            />
          </div>

          {/* Items Section */}
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>
                Daftar Produk yang Dipesan ({items.length} item)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  padding: '5px 12px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} />
                <span>+ Tambah Baris Produk</span>
              </button>
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
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)' }}>Produk Merchandise</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', width: '110px' }}>Qty Order</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', width: '140px' }}>Unit Cost (Modal)</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', width: '130px', textAlign: 'right' }}>Subtotal</th>
                    <th style={{ padding: '8px 12px', color: 'var(--text-dim)', width: '40px', textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => {
                    const rowSubtotal = row.qtyOrdered * row.unitCost;
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: idx < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        }}
                      >
                        {/* Product Selector */}
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            className="input-field"
                            value={row.productId}
                            onChange={e => handleProductChange(idx, e.target.value)}
                            style={{ width: '100%', fontSize: '12px', padding: '6px 8px' }}
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                [{p.sku}] {p.name} (Stok: {p.stock})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Qty Input */}
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min="1"
                            className="input-field font-mono"
                            value={row.qtyOrdered}
                            onChange={e => handleQtyChange(idx, parseInt(e.target.value, 10))}
                            style={{ width: '100%', fontSize: '12px', padding: '6px 8px', textAlign: 'right' }}
                          />
                        </td>

                        {/* Unit Cost Input */}
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            className="input-field font-mono"
                            value={row.unitCost}
                            onChange={e => handleCostChange(idx, parseFloat(e.target.value))}
                            style={{ width: '100%', fontSize: '12px', padding: '6px 8px', textAlign: 'right' }}
                          />
                        </td>

                        {/* Subtotal */}
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: 'var(--cyan)' }}>
                          <span className="font-mono">{formatRupiah(rowSubtotal)}</span>
                        </td>

                        {/* Delete row */}
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-dim)',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            title="Hapus baris ini"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer with Summary and Action Buttons */}
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
          {/* Summary */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Total Unit Dipesan</div>
              <div style={{ fontSize: '14px', fontWeight: 700 }} className="font-mono">
                {totalQtyCalculated} pcs
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Estimasi Total PO</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan)' }} className="font-mono">
                {formatRupiah(totalCalculated)}
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
              type="button"
              className="btn"
              onClick={() => handleSave('DRAFT')}
              disabled={isSubmitting || activeSuppliers.length === 0}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-bright)',
                border: '1px solid var(--border-muted)',
              }}
            >
              Simpan DRAFT
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSave('ORDERED')}
              disabled={isSubmitting || activeSuppliers.length === 0}
              style={{
                boxShadow: '0 0 15px var(--primary-glow)',
                minWidth: '150px',
              }}
            >
              {isSubmitting ? 'Memproses...' : 'Buat & Order (ORDERED)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
