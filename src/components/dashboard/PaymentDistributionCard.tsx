import React from 'react';
import { usePos } from '../../context/PosContext';
import { formatRupiah } from '../../utils/formatters';

export const PaymentDistributionCard: React.FC = () => {
  const { transactions } = usePos();

  // Aggregate stats from live transactions
  const stats = transactions.reduce(
    (acc, tx) => {
      if (tx.status === 'success' || (tx.status as string) === 'completed') {
        const m = tx.paymentMethod as 'cash' | 'qris' | 'transfer';
        if (acc[m]) {
          acc[m].total += tx.total;
          acc[m].count += 1;
        }
      }
      return acc;
    },
    {
      cash: { total: 0, count: 0 },
      qris: { total: 0, count: 0 },
      transfer: { total: 0, count: 0 },
    }
  );

  const grandTotal = stats.cash.total + stats.qris.total + stats.transfer.total;
  const cashPct = grandTotal > 0 ? Math.round((stats.cash.total / grandTotal) * 100) : 0;
  const qrisPct = grandTotal > 0 ? Math.round((stats.qris.total / grandTotal) * 100) : 0;
  const transferPct = grandTotal > 0 ? Math.max(0, 100 - cashPct - qrisPct) : 0;

  return (
    <div className="dashboard-card">
      <div className="db-card-header">
        <div className="db-card-title-group">
          <h3>Distribusi Metode Pembayaran</h3>
          <p>Arus kas tunai vs nontunai di kasir offline</p>
        </div>
        <span
          style={{
            fontSize: '11px',
            color: 'var(--cyan)',
            fontWeight: 700,
            background: 'var(--cyan-bg)',
            padding: '2px 8px',
            borderRadius: '4px',
          }}
        >
          Laci Kasir Aman
        </span>
      </div>

      <div className="payment-dist-bar-wrapper">
        <div className="payment-split-progress">
          <div className="dist-segment cash" style={{ width: `${cashPct}%` }}></div>
          <div className="dist-segment qris" style={{ width: `${qrisPct}%` }}></div>
          <div className="dist-segment transfer" style={{ width: `${transferPct}%` }}></div>
        </div>

        <div className="payment-dist-legend">
          {/* Cash */}
          <div className="dist-legend-item">
            <div className="dli-title">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
              <span>Tunai (Cash) {cashPct}%</span>
            </div>
            <div className="dli-amount">{formatRupiah(stats.cash.total, true, false)}</div>
            <div className="dli-txcount">{stats.cash.count} Transaksi</div>
          </div>

          {/* QRIS */}
          <div className="dist-legend-item">
            <div className="dli-title">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }}></span>
              <span>QRIS Statis {qrisPct}%</span>
            </div>
            <div className="dli-amount">{formatRupiah(stats.qris.total, true, false)}</div>
            <div className="dli-txcount">{stats.qris.count} Transaksi</div>
          </div>

          {/* Transfer */}
          <div className="dist-legend-item">
            <div className="dli-title">
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8' }}></span>
              <span>Transfer {transferPct}%</span>
            </div>
            <div className="dli-amount">{formatRupiah(stats.transfer.total, true, false)}</div>
            <div className="dli-txcount">{stats.transfer.count} Transaksi</div>
          </div>
        </div>
      </div>
    </div>
  );
};
