import React from 'react';
import { X, Printer, Calendar, User, CreditCard, Tag, FileText, CheckCircle2, XCircle } from 'lucide-react';
import type { Transaction } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';
import { usePos } from '../../context/PosContext';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  const { openReceiptModal } = usePos();

  if (!transaction) return null;

  const isCompleted = transaction.status === 'success' || (transaction.status as string) === 'completed';
  const totalItemsCount = transaction.items.reduce((s, item) => s + item.quantity, 0);

  const getMethodBadge = (m: string) => {
    switch (m.toLowerCase()) {
      case 'cash':
        return { label: 'TUNAI (CASH)', bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
      case 'qris':
        return { label: 'QRIS STATIS', bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' };
      case 'transfer':
      default:
        return { label: 'TRANSFER BANK', bg: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', border: 'rgba(129, 140, 248, 0.3)' };
    }
  };

  const methodBadge = getMethodBadge(transaction.paymentMethod);

  const handleReprintReceipt = () => {
    openReceiptModal(transaction);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        style={{
          width: '580px',
          maxWidth: '92vw',
          maxHeight: '92vh',
          background: '#0b1220',
          border: '1px solid rgba(99, 102, 241, 0.35)',
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
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--text-dim)',
                letterSpacing: '0.8px',
              }}
            >
              DETAIL NOTA TRANSAKSI
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isCompleted ? '#34d399' : '#f87171',
                border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isCompleted ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              <span>{isCompleted ? 'COMPLETED / LUNAS' : 'CANCELLED'}</span>
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

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Invoice Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
                NOMOR INVOICE
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--cyan)', marginTop: '2px' }}>
                {transaction.transactionNumber}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: methodBadge.bg,
                  color: methodBadge.color,
                  border: `1px solid ${methodBadge.border}`,
                }}
              >
                {methodBadge.label}
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Terminal: {transaction.terminalId || 'POS-01'}
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '11px',
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)' }}>
                <Calendar size={13} />
                <span>Tanggal & Waktu:</span>
              </div>
              <div style={{ fontWeight: 700, color: '#ffffff', marginTop: '3px' }}>
                {formatDateTime(transaction.transactionDate)}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)' }}>
                <User size={13} />
                <span>Kasir Bertugas:</span>
              </div>
              <div style={{ fontWeight: 700, color: '#ffffff', marginTop: '3px' }}>
                {transaction.cashierName}
              </div>
            </div>
          </div>

          {/* Items Table (BAGIAN 5: Product, SKU, Price, Quantity, Subtotal) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.6px' }}>
                RINCIAN ITEM ({totalItemsCount} PCS)
              </span>
            </div>

            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.01)',
              }}
            >
              <table className="cosplay-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    <th>Merchandise & SKU</th>
                    <th style={{ textAlign: 'right', width: '90px' }}>Harga Satuan</th>
                    <th style={{ textAlign: 'center', width: '60px' }}>Qty</th>
                    <th style={{ textAlign: 'right', width: '100px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {item.image && (
                            <img
                              src={item.image}
                              alt=""
                              style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', background: '#040810', flexShrink: 0 }}
                            />
                          )}
                          <div>
                            <span className="inv-code" style={{ fontSize: '10px' }}>{item.sku}</span>
                            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '12px' }}>
                              {item.productName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {formatRupiah(item.price, true, false)}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--cyan)' }}>
                        {item.quantity}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>
                        {formatRupiah(item.subtotal, true, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Box: Subtotal, Discount, Total, Payment, Change (BAGIAN 5) */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Subtotal Kotor</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatRupiah(transaction.subtotal, true, false)}</span>
            </div>

            {transaction.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f43f5e' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Tag size={12} />
                  <span>Potongan Diskon {transaction.discountCode ? `(${transaction.discountCode})` : ''}</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  -{formatRupiah(transaction.discount, true, false)}
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 900,
                color: '#ffffff',
                paddingTop: '6px',
                borderTop: '1px dashed var(--border-subtle)',
              }}
            >
              <span>Grand Total</span>
              <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                {formatRupiah(transaction.total, true, false)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', paddingTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CreditCard size={12} />
                <span>Nominal Dibayar ({transaction.paymentMethod.toUpperCase()})</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {formatRupiah(transaction.paymentAmount, true, false)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
              <span>Kembalian</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399', fontWeight: 700 }}>
                {formatRupiah(transaction.changeAmount, true, false)}
              </span>
            </div>
          </div>

          {/* Notes (if any) */}
          {transaction.notes && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
              }}
            >
              <FileText size={14} color="var(--primary-light)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ color: 'var(--text-dim)', fontWeight: 700 }}>Catatan Transaksi: </span>
                <span>{transaction.notes}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (BAGIAN 6: Cetak Ulang Struk) */}
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
            onClick={onClose}
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
            Tutup (Esc)
          </button>

          <button
            type="button"
            onClick={handleReprintReceipt}
            style={{
              flex: 2,
              padding: '10px',
              background: 'var(--primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 0 15px var(--primary-glow)',
            }}
          >
            <Printer size={15} />
            <span>Cetak Ulang Struk (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
