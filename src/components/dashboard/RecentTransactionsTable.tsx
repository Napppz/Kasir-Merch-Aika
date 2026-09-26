import React from 'react';
import { Eye, ArrowUpRight } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

export const RecentTransactionsTable: React.FC = () => {
  const { transactions, setCurrentPage, openReceiptModal } = usePos();

  const getMethodBadge = (m: string) => {
    if (m === 'cash') {
      return <span className="payment-method-badge cash">Cash</span>;
    } else if (m === 'qris') {
      return <span className="payment-method-badge qris">QRIS</span>;
    } else {
      return <span className="payment-method-badge transfer">Transfer</span>;
    }
  };

  const getItemsSummary = (items: { productName: string; quantity: number }[]) => {
    if (!items || items.length === 0) return '-';
    if (items.length === 1) {
      return `${items[0].quantity}x ${items[0].productName}`;
    }
    return `${items[0].quantity}x ${items[0].productName}, ${items.length - 1} item lainnya`;
  };

  return (
    <div className="recent-transactions-card">
      <div className="db-card-header">
        <div className="db-card-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan)' }}></span>
            <h3>Transaksi Terbaru (Live Feed)</h3>
          </div>
          <p>Tersimpan lokal di IndexedDB/SQLite • Siap cetak thermal</p>
        </div>

        <button
          type="button"
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
          }}
          onClick={() => setCurrentPage('transactions')}
        >
          <span>Lihat Semua {transactions.length} Transaksi</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="data-table-wrapper">
        <table className="cosplay-table">
          <thead>
            <tr>
              <th>NO. INVOICE</th>
              <th>WAKTU</th>
              <th>RINGKASAN ITEM</th>
              <th>TOTAL BELANJA</th>
              <th>METODE</th>
              <th>KASIR</th>
              <th style={{ textAlign: 'right' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 5).map((tx) => (
              <tr key={tx.id}>
                <td>
                  <span className="inv-code">{tx.transactionNumber}</span>
                </td>
                <td>
                  <span className="inv-time">{formatDateTime(tx.transactionDate).split(',')[1]?.trim() || 'Barusan'}</span>
                </td>
                <td>
                  <span style={{ color: 'var(--text-main)', fontSize: '11.5px' }}>
                    {getItemsSummary(tx.items)}
                  </span>
                </td>
                <td>
                  <strong style={{ color: '#ffffff' }}>
                    {formatRupiah(tx.total, true, false)}
                  </strong>
                </td>
                <td>{getMethodBadge(tx.paymentMethod)}</td>
                <td>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {tx.cashierName.split('(')[0].trim()}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="table-detail-btn"
                    onClick={() => openReceiptModal(tx)}
                  >
                    <Eye size={12} />
                    <span>Detail</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
