import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, PackagePlus, AlertCircle } from 'lucide-react';
import { usePos } from '../../context/PosContext';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProductId?: string;
}

const STOCK_IN_REASONS = [
  'Barang Baru',
  'Restock',
  'Titipan Cosplayer',
  'Transfer Barang',
  'Lainnya',
] as const;

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  preselectedProductId,
}) => {
  const { products, stockIn } = usePos();

  const [productId, setProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('5');
  const [reason, setReason] = useState<string>('Restock');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedProductId && products.some(p => p.id === preselectedProductId)) {
        setProductId(preselectedProductId);
      } else if (products.length > 0 && !productId) {
        setProductId(products[0].id);
      }
      setQuantity('5');
      setReason('Restock');
      setNote('');
      setErrorMsg(null);
    }
  }, [isOpen, preselectedProductId, products]);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === productId);
  const parsedQty = parseInt(quantity, 10);
  const validQty = !isNaN(parsedQty) && parsedQty > 0;
  const currentStock = selectedProduct ? selectedProduct.stock : 0;
  const estimatedNewStock = validQty ? currentStock + parsedQty : currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setErrorMsg('Pilih merchandise terlebih dahulu.');
      return;
    }
    if (!validQty) {
      setErrorMsg('Jumlah stok masuk wajib berupa bilangan bulat dan lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await stockIn({
      productId,
      quantity: parsedQty,
      reason,
      note: note.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Gagal menambahkan stok masuk.');
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
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 0 35px rgba(6, 182, 212, 0.2)',
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
            background: 'rgba(6, 182, 212, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cyan)',
              }}
            >
              <ArrowDownRight size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
                Stock In Merchandise
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Catat barang masuk booth konvensi (Restock / Barang Baru)
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
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              disabled={isSubmitting}
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
                  [{p.sku}] {p.name} (Stok Saat Ini: {p.stock} pcs)
                </option>
              ))}
            </select>
          </div>

          {/* Reason Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Alasan Stok Masuk *
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {STOCK_IN_REASONS.map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setReason(r)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: reason === r ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: reason === r ? 'var(--cyan)' : 'var(--text-secondary)',
                    border: `1px solid ${reason === r ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Jumlah Masuk (Unit / Pcs) *
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[5, 10, 20, 50].map(n => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setQuantity(String(n))}
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
                    +{n}
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
              placeholder="Contoh: 10"
              required
              disabled={isSubmitting}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>

          {/* Calculation / Preview Box */}
          {selectedProduct && (
            <div
              style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px dashed rgba(6, 182, 212, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
                  REKONSILIASI STOK
                </span>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Stok Sebelum: <strong style={{ color: '#ffffff' }}>{currentStock} pcs</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 800 }}>
                  ESTIMASI STOK AKHIR
                </span>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--cyan)' }}>
                  {estimatedNewStock} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>pcs</span>
                </div>
              </div>
            </div>
          )}

          {/* Note Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contoh: Kardus cadangan batch 2, titipan @cosplayer_aya"
              disabled={isSubmitting}
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

          {/* Actions */}
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
              disabled={isSubmitting || !validQty}
              style={{
                flex: 2,
                padding: '10px',
                background: 'var(--cyan)',
                color: '#04242d',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: isSubmitting || !validQty ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || !validQty ? 0.6 : 1,
                boxShadow: '0 0 15px var(--cyan-glow)',
              }}
            >
              <PackagePlus size={16} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Stock In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
