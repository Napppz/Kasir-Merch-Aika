import React, { useState } from 'react';
import { Clock, CreditCard, Banknote, Smartphone, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { formatRupiah } from '../../utils/formatters';

const PAYMENT_ICON: Record<string, React.ReactNode> = {
  cash: <Banknote size={12} />,
  qris: <Smartphone size={12} />,
  transfer: <CreditCard size={12} />,
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Tunai',
  qris: 'QRIS',
  transfer: 'Transfer',
};

export const RecentTransactionsMini: React.FC = () => {
  const { transactions, setCurrentPage, openReceiptModal } = usePos();
  const [expanded, setExpanded] = useState(false);

  const today = new Date().toDateString();
  const todayTxs = transactions
    .filter((tx) => new Date(tx.transactionDate).toDateString() === today)
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 5);

  if (todayTxs.length === 0) return null;

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="recent-txs-mini">
      <div
        className="recent-txs-header"
        onClick={() => setExpanded((p) => !p)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((p) => !p)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} color="var(--cyan)" />
          <span className="recent-txs-title">Transaksi Hari Ini Terakhir</span>
          <span className="recent-txs-count">{todayTxs.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="recent-txs-see-all"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage('transactions');
            }}
          >
            Lihat Semua <ChevronRight size={11} />
          </button>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-dim)',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <div className="recent-txs-list">
          {todayTxs.map((tx) => (
            <button
              key={tx.id}
              type="button"
              className="recent-tx-row"
              onClick={() => openReceiptModal(tx)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                {tx.status === 'success' ? (
                  <CheckCircle size={13} color="#34d399" style={{ flexShrink: 0 }} />
                ) : (
                  <XCircle size={13} color="#f43f5e" style={{ flexShrink: 0 }} />
                )}
                <span className="recent-tx-num">{tx.transactionNumber}</span>
                <span className="recent-tx-time">{formatTime(tx.transactionDate)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span className="recent-tx-method">
                  {PAYMENT_ICON[tx.paymentMethod]}
                  {PAYMENT_LABEL[tx.paymentMethod]}
                </span>
                <span className="recent-tx-total">
                  {formatRupiah(tx.total, true, false)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
