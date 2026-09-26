import React, { useState, useEffect } from 'react';
import { 
  X, 
  ClipboardCheck, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Search,
  RotateCcw
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import type { StockOpnameSession, StockOpnameItem } from '../../types';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OpnameWorkingItem {
  productId: string;
  sku: string;
  name: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  note: string;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({ isOpen, onClose }) => {
  const { products, opnameSessions, submitOpnameSession, settings } = usePos();

  const [step, setStep] = useState<'count' | 'review'>('count');
  const [workingItems, setWorkingItems] = useState<OpnameWorkingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sessionNote, setSessionNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize working items when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial: OpnameWorkingItem[] = products
        .filter(p => p.isActive)
        .map(p => ({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          systemStock: p.stock,
          physicalStock: p.stock, // Default to system stock initially
          difference: 0,
          note: '',
        }));
      setWorkingItems(initial);
      setStep('count');
      setSearchTerm('');
      setSessionNote('');
      setErrorMsg(null);
    }
  }, [isOpen, products]);

  if (!isOpen) return null;

  const handlePhysicalStockChange = (productId: string, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    const validVal = isNaN(parsed) ? 0 : Math.max(0, parsed);

    setWorkingItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const diff = validVal - item.systemStock;
          return {
            ...item,
            physicalStock: validVal,
            difference: diff,
          };
        }
        return item;
      })
    );
  };

  const handleItemNoteChange = (productId: string, noteVal: string) => {
    setWorkingItems(prev =>
      prev.map(item => (item.productId === productId ? { ...item, note: noteVal } : item))
    );
  };

  const resetAllToSystem = () => {
    setWorkingItems(prev =>
      prev.map(item => ({
        ...item,
        physicalStock: item.systemStock,
        difference: 0,
      }))
    );
  };

  const filteredItems = workingItems.filter(
    item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsWithDiscrepancy = workingItems.filter(item => item.difference !== 0);
  const totalDifferenceUnits = workingItems.reduce((acc, item) => acc + item.difference, 0);

  const handleProceedToReview = () => {
    setErrorMsg(null);
    setStep('review');
  };

  const handleFinalConfirm = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const now = new Date();
    const sequence = opnameSessions.length + 1;
    const opNumber = `SOP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(sequence).padStart(3, '0')}`;

    const sessionItems: StockOpnameItem[] = workingItems.map((item, idx) => ({
      id: `soi-${Date.now()}-${idx + 1}`,
      sessionId: `sop-${Date.now()}`,
      productId: item.productId,
      systemStock: item.systemStock,
      physicalStock: item.physicalStock,
      difference: item.difference,
      note: item.note ? item.note : item.difference !== 0 ? `Selisih opname ${item.difference > 0 ? '+' : ''}${item.difference}` : undefined,
    }));

    const session: StockOpnameSession = {
      id: `sop-${Date.now()}`,
      opnameNumber: opNumber,
      startedAt: now.toISOString(),
      completedAt: now.toISOString(),
      status: 'COMPLETED',
      totalItems: workingItems.length,
      totalDifference: totalDifferenceUnits,
      note: sessionNote.trim() || undefined,
      createdBy: settings.cashierName || 'Operator Booth',
      items: sessionItems,
    };

    const res = await submitOpnameSession(session);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Gagal menyimpan dan menerapkan sesi stock opname.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        style={{
          width: '850px',
          maxWidth: '95vw',
          maxHeight: '92vh',
          background: '#0b1220',
          border: '1px solid rgba(129, 140, 248, 0.4)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 0 40px rgba(99, 102, 241, 0.2)',
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
            background: 'rgba(99, 102, 241, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-light)',
              }}
            >
              <ClipboardCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
                Stock Opname Fisik Booth
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                {step === 'count'
                  ? 'Langkah 1 dari 2: Hitung dan masukkan stok fisik riil di booth'
                  : 'Langkah 2 dari 2: Review selisih dan konfirmasi penyesuaian stok'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                background: step === 'count' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: step === 'count' ? '#a5b4fc' : '#34d399',
                border: `1px solid ${step === 'count' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
              }}
            >
              {step === 'count' ? 'Tahap Penghitungan' : 'Tahap Review & Konfirmasi'}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{ color: 'var(--text-dim)', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div
            style={{
              margin: '12px 20px 0',
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

        {/* Content Body */}
        {step === 'count' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 20px' }}>
            {/* Top Bar: Search & Quick Reset */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                }}
              >
                <Search size={14} color="var(--text-dim)" />
                <input
                  type="text"
                  placeholder="Cari nama atau SKU produk..."
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

              <button
                type="button"
                onClick={resetAllToSystem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Reset ke Stok Sistem</span>
              </button>
            </div>

            {/* Table Container */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
            >
              <table className="cosplay-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    <th style={{ width: '100px' }}>SKU</th>
                    <th>Nama Merchandise</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Stok Sistem</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Stok Fisik</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Selisih</th>
                    <th style={{ width: '160px' }}>Catatan Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const hasDiff = item.difference !== 0;
                    return (
                      <tr
                        key={item.productId}
                        style={{
                          background: hasDiff ? 'rgba(244, 63, 94, 0.03)' : 'transparent',
                        }}
                      >
                        <td>
                          <span className="inv-code" style={{ fontSize: '11px' }}>{item.sku}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '12px' }}>
                            {item.name}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {item.systemStock}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.physicalStock}
                            onChange={e => handlePhysicalStockChange(item.productId, e.target.value)}
                            style={{
                              width: '70px',
                              textAlign: 'center',
                              padding: '4px 6px',
                              background: '#040810',
                              border: `1.5px solid ${hasDiff ? 'var(--cyan)' : 'var(--border-muted)'}`,
                              borderRadius: '4px',
                              color: '#ffffff',
                              fontSize: '13px',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.difference === 0 ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#34d399',
                                background: 'rgba(16, 185, 129, 0.12)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              0 (Cocok)
                            </span>
                          ) : item.difference < 0 ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#f43f5e',
                                background: 'rgba(244, 63, 94, 0.15)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              {item.difference} pcs
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: 'var(--cyan)',
                                background: 'var(--cyan-bg)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              +{item.difference} pcs
                            </span>
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder={hasDiff ? 'Alasan selisih...' : '-'}
                            value={item.note}
                            onChange={e => handleItemNoteChange(item.productId, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              background: 'transparent',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)',
                              fontSize: '11px',
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Summary Pill Bar */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span>
                  Total Merchandise: <strong style={{ color: '#ffffff' }}>{workingItems.length} jenis</strong>
                </span>
                <span>
                  Produk Berselisih:{' '}
                  <strong style={{ color: itemsWithDiscrepancy.length > 0 ? '#f43f5e' : '#34d399' }}>
                    {itemsWithDiscrepancy.length} produk
                  </strong>
                </span>
                <span>
                  Total Selisih Unit:{' '}
                  <strong style={{ color: totalDifferenceUnits === 0 ? '#34d399' : totalDifferenceUnits > 0 ? 'var(--cyan)' : '#f43f5e' }}>
                    {totalDifferenceUnits > 0 ? `+${totalDifferenceUnits}` : totalDifferenceUnits} unit
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToReview}
                style={{
                  padding: '8px 18px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px var(--primary-glow)',
                }}
              >
                <span>Lanjut Review ({itemsWithDiscrepancy.length} Selisih)</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: REVIEW & CONFIRMATION */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 20px', gap: '14px' }}>
            {/* Warning Announcement */}
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AlertTriangle size={20} color="var(--primary-light)" />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Periksa kembali hasil penghitungan fisik sebelum konfirmasi. Menekan tombol <strong>Terapkan Stock Opname</strong> akan langsung memperbarui nilai <code>Product.stock</code> dan mencatat pergerakan <code>OPNAME_IN / OPNAME_OUT</code> secara permanen.
              </div>
            </div>

            {/* Discrepancy Items Summary Table */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              {itemsWithDiscrepancy.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#34d399' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>Stok Fisik 100% Sesuai dengan Sistem!</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Tidak ada selisih stok yang perlu disesuaikan.
                  </div>
                </div>
              ) : (
                <table className="cosplay-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                      <th>SKU & Merchandise</th>
                      <th style={{ textAlign: 'center' }}>Stok Sebelum</th>
                      <th style={{ textAlign: 'center' }}>Stok Baru (Fisik)</th>
                      <th style={{ textAlign: 'center' }}>Selisih Unit</th>
                      <th style={{ textAlign: 'center' }}>Tipe Penyesuaian</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsWithDiscrepancy.map(item => (
                      <tr key={item.productId}>
                        <td>
                          <span className="inv-code" style={{ fontSize: '11px' }}>{item.sku}</span>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '12px' }}>{item.name}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {item.systemStock} pcs
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff', fontSize: '14px' }}>
                          {item.physicalStock} pcs
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 800,
                              color: item.difference > 0 ? 'var(--cyan)' : '#f43f5e',
                            }}
                          >
                            {item.difference > 0 ? `+${item.difference}` : item.difference} pcs
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: item.difference > 0 ? 'var(--cyan-bg)' : 'rgba(244, 63, 94, 0.15)',
                              color: item.difference > 0 ? 'var(--cyan)' : '#f43f5e',
                            }}
                          >
                            {item.difference > 0 ? 'OPNAME_IN' : 'OPNAME_OUT'}
                          </span>
                        </td>
                        <td style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {item.note || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Note for Session */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Catatan Sesi Stock Opname (Opsional)
              </label>
              <input
                type="text"
                value={sessionNote}
                onChange={e => setSessionNote(e.target.value)}
                placeholder="Contoh: Opname sesi penutupan Hari 1 Comifuro / AFA"
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

            {/* Review Footer Actions */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep('count')}
                disabled={isSubmitting}
                style={{
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-muted)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ← Kembali ke Hitung
              </button>

              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 16px var(--primary-glow)',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Menerapkan Opname...' : 'Konfirmasi & Terapkan Stock Opname'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
