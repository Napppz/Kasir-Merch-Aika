import React, { useMemo } from 'react';
import { usePos } from '../../context/PosContext';
import { formatRupiah } from '../../utils/formatters';
import { isCompletedTransaction } from '../../services/reportService';

export const HourlyTrafficChart: React.FC = () => {
  const { transactions } = usePos();

  const slots = useMemo(() => {
    const completed = transactions.filter(isCompletedTransaction);

    // 5 convention shift blocks: 10:00 (Gate Open), 12:00 (Rush Hour), 14:00 (Parade Peak), 16:00 (Sesi Sore), 18:00 (Pre-Close)
    const blocks = [
      { time: '10:00', label: 'Pagi', minH: 9, maxH: 11, amountNum: 0 },
      { time: '12:00', label: 'Siang', minH: 11, maxH: 13, amountNum: 0 },
      { time: '14:00', label: 'Puncak', minH: 13, maxH: 15, amountNum: 0 },
      { time: '16:00', label: 'Sore', minH: 15, maxH: 17, amountNum: 0 },
      { time: '18:00', label: 'Malam', minH: 17, maxH: 21, amountNum: 0 },
    ];

    for (const tx of completed) {
      const h = new Date(tx.transactionDate).getHours();
      for (const b of blocks) {
        if (h >= b.minH && h < b.maxH) {
          b.amountNum += tx.total;
          break;
        }
      }
    }

    const maxVal = Math.max(...blocks.map(b => b.amountNum));

    return blocks.map(b => {
      const height = maxVal > 0 ? Math.max(15, Math.round((b.amountNum / maxVal) * 100)) : 15;
      const isPeak = b.amountNum === maxVal && b.amountNum > 0;
      const isHighlight = !isPeak && b.amountNum >= maxVal * 0.6 && b.amountNum > 0;

      let variant: 'normal' | 'highlight' | 'peak' = 'normal';
      if (isPeak) variant = 'peak';
      else if (isHighlight) variant = 'highlight';

      return {
        time: b.time,
        label: b.label,
        amount: b.amountNum > 0 ? formatRupiah(b.amountNum, true, false) : 'Rp 0',
        height: `${height}%`,
        variant,
        rawAmount: b.amountNum,
      };
    });
  }, [transactions]);

  const peakSlot = slots.find(s => s.variant === 'peak');

  return (
    <div className="dashboard-card">
      <div className="db-card-header">
        <div className="db-card-title-group">
          <h3>Trafik Jam Sibuk Booth & Omzet</h3>
          <p>Korelasi lonjakan pengunjung convention dengan total kasir</p>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            background: 'rgba(168, 85, 247, 0.15)',
            color: '#d8b4fe',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {peakSlot && peakSlot.rawAmount > 0
            ? `Puncak Kasir: ${peakSlot.time} (${peakSlot.amount})`
            : 'Menunggu Aktivitas Kasir'}
        </span>
      </div>

      {/* Hourly Bar Chart */}
      <div className="hourly-chart-container">
        {slots.map((b, idx) => (
          <div key={idx} className="chart-bar-col">
            <span className="bar-amount-label">{b.amount}</span>
            <div
              className={`chart-bar-pill ${b.variant === 'peak' ? 'peak' : b.variant === 'highlight' ? 'highlight' : ''}`}
              style={{ height: b.height }}
            ></div>
            <span className="bar-time-label">{b.time}</span>
            <span
              className="bar-tag-label"
              style={{
                color: b.variant === 'peak' ? '#c084fc' : b.variant === 'highlight' ? '#22d3ee' : undefined,
                fontWeight: b.variant !== 'normal' ? 'bold' : 'normal',
              }}
            >
              {b.label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend & Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-dim)',
          paddingTop: '4px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#c084fc' }}></span>
            Penjualan Tertinggi
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22d3ee' }}></span>
            Sesi Ramai
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#1e293b' }}></span>
            Trafik Normal
          </span>
        </div>
        <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>
          {transactions.filter(isCompletedTransaction).length} Total Transaksi Sukses
        </span>
      </div>
    </div>
  );
};
