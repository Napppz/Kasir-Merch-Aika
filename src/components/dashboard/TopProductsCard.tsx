import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { formatRupiah } from '../../utils/formatters';
import { getTopProducts } from '../../services/reportService';

export const TopProductsCard: React.FC = () => {
  const { transactions, products } = usePos();

  const topItems = useMemo(() => {
    return getTopProducts(transactions, products, 5);
  }, [transactions, products]);

  return (
    <div className="dashboard-card">
      <div className="db-card-header">
        <div className="db-card-title-group">
          <h3>Top 5 Merchandise Terlaris</h3>
          <p>Paling diminati pengunjung hari ini</p>
        </div>
        <div style={{ color: 'var(--pink)' }}>
          <Award size={18} />
        </div>
      </div>

      <div className="top-merch-list">
        {topItems.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
            Belum ada penjualan tercatat.
          </div>
        ) : (
          topItems.map((item) => (
            <div key={item.productId} className="top-merch-item">
              <div className="tmi-left">
                <span className="rank-badge">{item.rank}</span>
                {item.image && (
                  <img src={item.image} alt={item.name} className="tmi-thumb" />
                )}
                <div>
                  <div className="tmi-name">{item.name}</div>
                  <div className="tmi-sales-count">{item.quantitySold} pcs terjual</div>
                </div>
              </div>

              <div className="tmi-right">
                <div className="tmi-omzet">{formatRupiah(item.revenue, true, false)}</div>
                <div className="tmi-unit">@{formatRupiah(item.averagePrice, true, false)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
