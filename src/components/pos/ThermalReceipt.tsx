import React from 'react';
import { Printer, Download, PlusCircle, CheckCircle, Database } from 'lucide-react';
import type { Transaction, BoothSettings } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

interface ThermalReceiptProps {
  transaction: Transaction;
  settings: BoothSettings;
  onNewTransaction?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  transaction,
  settings,
  onNewTransaction,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Uses browser print dialog which has "Save as PDF" built-in
    window.print();
  };

  const totalQty = transaction.items.reduce((sum, item) => sum + item.quantity, 0);

  const getMethodTitle = (m: string) => {
    if (m === 'cash') return 'CASH / TUNAI';
    if (m === 'qris') return 'QRIS STATIS';
    return 'TRANSFER BANK';
  };

  return (
    <div className="thermal-receipt-preview-wrapper">
      <div className="receipt-preview-header">
        <span>Pratinjau Struk 80mm</span>
        <span className="receipt-status-pill">
          <CheckCircle size={12} />
          <span>ESC/POS Thermal Ready</span>
        </span>
      </div>

      {/* Realistic 80mm Thermal Receipt with serrated tear edges */}
      <div className="thermal-receipt-paper" id="thermal-receipt-node">
        {/* Store Title */}
        <div className="receipt-header">
          <div className="receipt-store-title">{settings.boothName}</div>
          <div className="receipt-store-sub">Booth A-12 {settings.eventName}</div>
          <div className="receipt-store-sub">Jakarta International Expo Kemayoran</div>
        </div>

        <hr className="receipt-divider" />

        {/* Invoice Meta */}
        <div className="receipt-meta">
          <div className="receipt-meta-row">
            <span>No. Inv</span>
            <span>{transaction.transactionNumber}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Tanggal</span>
            <span>{formatDateTime(transaction.transactionDate)}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Kasir</span>
            <span>{transaction.cashierName}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Pelanggan</span>
            <span>{transaction.notes || 'Umum / Walk-in'}</span>
          </div>
        </div>

        <hr className="receipt-divider" />

        {/* Items List */}
        <div className="receipt-items-list">
          {transaction.items.map((item, idx) => (
            <div key={idx} className="receipt-item-entry">
              <span className="rie-name">{item.productName}</span>
              <div className="rie-calc-row">
                <span>{item.quantity} x {formatRupiah(item.price, true, false)}</span>
                <span style={{ fontWeight: 600 }}>{formatRupiah(item.subtotal, true, false)}</span>
              </div>
            </div>
          ))}
        </div>

        <hr className="receipt-divider" />

        {/* Totals & Payment */}
        <div className="receipt-totals">
          <div className="receipt-meta-row">
            <span>Subtotal</span>
            <span>{formatRupiah(transaction.subtotal, true, false)}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Diskon Promo</span>
            <span>{formatRupiah(transaction.discount, true, false)}</span>
          </div>

          <div className="receipt-total-main">
            <span>TOTAL</span>
            <span>{formatRupiah(transaction.total, true, false)}</span>
          </div>

          <div className="receipt-meta-row">
            <span>{getMethodTitle(transaction.paymentMethod)}</span>
            <span>{formatRupiah(transaction.paymentAmount, true, false)}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Kembalian</span>
            <span>{formatRupiah(transaction.changeAmount, true, false)}</span>
          </div>
        </div>

        {/* Payment Confirmation Tag */}
        <div className="receipt-method-box">
          METODE: {getMethodTitle(transaction.paymentMethod)} (OFFLINE RECORDED)
        </div>
        {transaction.paymentMethod === 'qris' && (
          <div style={{ fontSize: '9px', textAlign: 'center', marginTop: '3px', color: '#444', fontFamily: 'monospace' }}>
            NMID: {settings.qrisNmid || 'ID1025440784557'} • {settings.qrisMerchantName || 'AIKA SESILIA'}
          </div>
        )}

        <div className="receipt-items-count-text">
          Total {transaction.items.length} Jenis Barang ({totalQty} pcs)
        </div>

        {/* Barcode representation */}
        <div className="receipt-barcode-box">
          <svg className="barcode-visual" viewBox="0 0 200 40">
            <rect x="0" y="0" width="200" height="40" fill="#ffffff" />
            <rect x="10" y="2" width="3" height="34" fill="#000000" />
            <rect x="15" y="2" width="2" height="34" fill="#000000" />
            <rect x="20" y="2" width="5" height="34" fill="#000000" />
            <rect x="28" y="2" width="2" height="34" fill="#000000" />
            <rect x="33" y="2" width="4" height="34" fill="#000000" />
            <rect x="40" y="2" width="2" height="34" fill="#000000" />
            <rect x="45" y="2" width="6" height="34" fill="#000000" />
            <rect x="54" y="2" width="2" height="34" fill="#000000" />
            <rect x="59" y="2" width="3" height="34" fill="#000000" />
            <rect x="65" y="2" width="5" height="34" fill="#000000" />
            <rect x="73" y="2" width="2" height="34" fill="#000000" />
            <rect x="78" y="2" width="4" height="34" fill="#000000" />
            <rect x="85" y="2" width="2" height="34" fill="#000000" />
            <rect x="90" y="2" width="5" height="34" fill="#000000" />
            <rect x="98" y="2" width="3" height="34" fill="#000000" />
            <rect x="104" y="2" width="2" height="34" fill="#000000" />
            <rect x="109" y="2" width="5" height="34" fill="#000000" />
            <rect x="117" y="2" width="3" height="34" fill="#000000" />
            <rect x="123" y="2" width="2" height="34" fill="#000000" />
            <rect x="128" y="2" width="5" height="34" fill="#000000" />
            <rect x="136" y="2" width="2" height="34" fill="#000000" />
            <rect x="141" y="2" width="4" height="34" fill="#000000" />
            <rect x="148" y="2" width="2" height="34" fill="#000000" />
            <rect x="153" y="2" width="6" height="34" fill="#000000" />
            <rect x="162" y="2" width="3" height="34" fill="#000000" />
            <rect x="168" y="2" width="4" height="34" fill="#000000" />
            <rect x="175" y="2" width="2" height="34" fill="#000000" />
            <rect x="180" y="2" width="5" height="34" fill="#000000" />
            <rect x="188" y="2" width="2" height="34" fill="#000000" />
          </svg>
          <div className="barcode-text">*{transaction.transactionNumber.replace(/-/g, '')}*</div>
        </div>

        {/* Footer info */}
        <div className="receipt-footer-text">
          <div>Arigatou Gozaimasu! ✨</div>
          <div>Follow IG/TikTok: {settings.socialHandle}</div>
          <div style={{ fontSize: '8.5px', marginTop: '2px' }}>{settings.receiptNote}</div>
        </div>

        <div className="receipt-cut-line">--- POTONG DI SINI ---</div>
      </div>

      {/* Action buttons */}
      <div className="receipt-actions-row">
        <button type="button" className="receipt-act-btn" onClick={handlePrint}>
          <Printer size={13} />
          <span>Cetak (Ctrl+P)</span>
        </button>
        <button type="button" className="receipt-act-btn" onClick={handleDownloadPDF}>
          <Download size={13} />
          <span>Simpan PDF</span>
        </button>
        {onNewTransaction && (
          <button type="button" className="receipt-act-btn" onClick={onNewTransaction}>
            <PlusCircle size={13} />
            <span>Baru (F1)</span>
          </button>
        )}
      </div>

      {/* Offline notification card */}
      <div className="receipt-offline-note">
        <Database size={15} className="ron-icon" />
        <div>
          <strong style={{ color: 'var(--text-main)', display: 'block' }}>
            Tersimpan di Database Lokal Perangkat
          </strong>
          Transaksi akan otomatis disinkronkan ke server pusat saat koneksi internet terhubung.
        </div>
      </div>
    </div>
  );
};
