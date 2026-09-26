import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string;
}

const ADJUSTMENT_REASONS = [
  'Salah Input',
  'Barang Rusak',
  'Barang Hilang',
  'Sample',
  'Dipinjam',
  'Lainnya',
] as const;

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  preselectedProductId,
}) => {
  const { products, adjustStock } = usePos();

  const [productId, setProductId] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('decrease');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('Salah Input');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfirmingBigChange, setIsConfirmingBigChange] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (preselectedProductId && products.some(p => p.id === preselectedProductId)) {
        setProductId(preselectedProductId);
      } else if (products.length > 0 && !productId) {
        setProductId(products[0].id);
      }
      setAdjustmentType('decrease');
      setQuantity('1');
      setReason('Salah Input');
      setNote('');
      setErrorMsg(null);
      setIsConfirmingBigChange(false);
    }
  }, [isOpen, preselectedProductId, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === productId);
  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const parsedQty = parseInt(quantity, 10);
  const validQty = !isNaN(parsedQty) && parsedQty > 0;

  const resultingStock = adjustmentType === 'increase'
    ? currentStock + (validQty ? parsedQty : 0)
    : currentStock - (validQty ? parsedQty : 0);

  const isNegative = resultingStock < 0;
  const isBigAdjustment = validQty && (parsedQty >= 5 || (adjustmentType === 'decrease' && parsedQty >= currentStock * 0.5));

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setErrorMsg('Pilih produk merchandise terlebih dahulu.');
      return;
    }
    if (!validQty) {
      setErrorMsg('Jumlah penyesuaian harus lebih dari 0.');
      return;
    }
    if (isNegative) {
      setErrorMsg(`Stok tidak boleh bernilai negatif! Stok saat ini (${currentStock}) tidak cukup untuk dikurangi ${parsedQty}.`);
      return;
    }

    if (isBigAdjustment && !isConfirmingBigChange) {
      setIsConfirmingBigChange(true);
      return;
    }

    executeAdjustment();
  };

  const executeAdjustment = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await adjustStock({
      productId,
      adjustmentType,
      quantity: parsedQty,
      reason,
      note: note.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Gagal menyesuaikan stok.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        style={{
          width: '520px',
          maxWidth: '92vw',
          background: '#0b1220',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 0 35px rgba(244, 63, 94, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 180ms ease-out',
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
            background: 'rgba(244, 63, 94, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
              }}
            >
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
                Penyesuaian Stok (Stock Adjustment)
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Koreksi selisih, barang rusak, hilang, atau salah hitung di booth
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ color: 'var(--text-dim)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleInitialSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#f87171',
                fontSize: '12px',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Pilih Merchandise *
            </label>
            <select
              value={productId}
              onChange={e => setProductId(e.target.value)}
              disabled={isSubmitting || isConfirmingBigChange}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name} (Stok Sistem: {p.stock} pcs)
                </option>
              ))}
            </select>
          </div>

          {/* Adjustment Direction Type: Tambah Stok vs Kurangi Stok */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Arah Penyesuaian *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAdjustmentType('decrease')}
                disabled={isSubmitting || isConfirmingBigChange}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: adjustmentType === 'decrease' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: adjustmentType === 'decrease' ? '#f43f5e' : 'var(--text-secondary)',
                  border: `1.5px solid ${adjustmentType === 'decrease' ? '#f43f5e' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>- Kurangi Stok</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('increase')}
                disabled={isSubmitting || isConfirmingBigChange}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: adjustmentType === 'increase' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: adjustmentType === 'increase' ? 'var(--cyan)' : 'var(--text-secondary)',
                  border: `1.5px solid ${adjustmentType === 'increase' ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>+ Tambah Stok</span>
              </button>
            </div>
          </div>

          {/* Quantity & Quick Pill selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Jumlah Unit Penyesuaian *
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 5, 10].map(n => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setQuantity(String(n))}
                    disabled={isSubmitting || isConfirmingBigChange}
                    style={{
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="Contoh: 2"
              required
              disabled={isSubmitting || isConfirmingBigChange}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${isNegative ? '#f43f5e' : 'var(--border-muted)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          {/* Reason Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Alasan Penyesuaian *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ADJUSTMENT_REASONS.map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  disabled={isSubmitting || isConfirmingBigChange}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: reason === r ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: reason === r ? '#f43f5e' : 'var(--text-secondary)',
                    border: `1px solid ${reason === r ? '#f43f5e' : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Stock Calculation Preview */}
          {selectedProduct && (
            <div
              style={{
                background: isNegative ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isNegative ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr auto 1fr',
                alignItems: 'center',
                textAlign: 'center',
                gap: '8px',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Stok Sistem</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  {currentStock} pcs
                </div>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-dim)' }}>
                {adjustmentType === 'increase' ? '+' : '-'}
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Penyesuaian</span>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    color: adjustmentType === 'increase' ? 'var(--cyan)' : '#f43f5e',
                    marginTop: '2px',
                  }}
                >
                  {validQty ? parsedQty : 0} pcs
                </div>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-dim)' }}>
                =
              </div>

              <div>
                <span style={{ fontSize: '10px', color: isNegative ? '#f43f5e' : 'var(--text-dim)' }}>
                  Stok Akhir
                </span>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: isNegative ? '#f43f5e' : '#34d399',
                    marginTop: '2px',
                  }}
                >
                  {resultingStock} pcs
                </div>
              </div>
            </div>
          )}

          {/* Note Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Catatan Detail Penyesuaian
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Rusak terinjak saat kerumunan cosplay, sample display"
              disabled={isSubmitting || isConfirmingBigChange}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: '12px',
              }}
            />
          </div>

          {/* Big Adjustment Confirmation Step (Bagian 20) */}
          {isConfirmingBigChange && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'pulse 1.5s infinite alternate',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 800, fontSize: '12px' }}>
                <AlertTriangle size={16} />
                <span>Konfirmasi Perubahan Stok Besar:</span>
              </div>
              <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
                Stok merchandise akan berubah dari <strong>{currentStock}</strong> menjadi <strong>{resultingStock}</strong>. Lanjutkan?
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsConfirmingBigChange(false)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-muted)',
                    color: 'var(--text-secondary)',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Ubah Kembali
                </button>
                <button
                  type="button"
                  onClick={executeAdjustment}
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: '6px 10px',
                    background: '#f59e0b',
                    color: '#000000',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {isSubmitting ? 'Memproses...' : 'Ya, Terapkan Perubahan'}
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {!isConfirmingBigChange && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-muted)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Batal (Esc)
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !validQty || isNegative}
                style={{
                  flex: 2,
                  padding: '10px',
                  background: isNegative ? 'rgba(244, 63, 94, 0.3)' : 'var(--primary)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isSubmitting || !validQty || isNegative ? 'not-allowed' : 'pointer',
                  boxShadow: isNegative ? 'none' : '0 0 15px var(--primary-glow)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Penyesuaian'}</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
