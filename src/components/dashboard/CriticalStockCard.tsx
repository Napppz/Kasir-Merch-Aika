import React from 'react';
import { PackageX } from 'lucide-react';
import { usePos } from '../../context/PosContext';

export const CriticalStockCard: React.FC = () => {
  const { products, quickAddStock } = usePos();

  // Low stock products
  const criticalProducts = products.filter(
    (p) => p.stock <= p.minimumStock || p.stock === 0
  );

  return (
    <div className="dashboard-card">
      <div className="db-card-header">
        <div className="db-card-title-group">
          <h3>Stok Kritis Booth</h3>
          <p>Prioritas Restock dari Gudang/Kardus</p>
        </div>
        <div style={{ color: '#f43f5e' }}>
          <PackageX size={18} />
        </div>
      </div>

      <div className="critical-stock-list">
        {criticalProducts.slice(0, 4).map((p) => {
          const isOut = p.stock === 0;
          return (
            <div key={p.id} className="critical-stock-item">
              <div>
                <div className="cs-title-row">
                  <span className="cs-name">{p.name}</span>
                  <span className={`cs-badge-count ${isOut ? 'out' : 'low'}`}>
                    {isOut ? 'Habis (0)' : `Sisa ${p.stock}`}
                  </span>
                </div>
                <div className="cs-location">
                  {p.locationNote ? `Lokasi simpan: ${p.locationNote}` : 'Banyak peminat bertanya!'}
                </div>
              </div>

              <button
                type="button"
                className="cs-action-btn"
                onClick={() => quickAddStock(p.id, 5)}
                title="Tambah 5 stok ke produk ini"
              >
                + Stok
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
