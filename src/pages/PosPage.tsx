import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { SearchBar } from '../components/pos/SearchBar';
import { CategoryBar } from '../components/pos/CategoryBar';
import { ProductGrid } from '../components/pos/ProductGrid';
import { CartPanel } from '../components/pos/CartPanel';

export const PosPage: React.FC = () => {
  const { settings } = usePos();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <div className="page-subheader">
        <div className="subheader-title-group">
          <h2>
            <ShoppingBag size={20} color="var(--primary-light)" />
            <span>Kasir POS Booth</span>
            <span className="event-tag-badge">COMIC FEST 2026</span>
          </h2>
          <div className="subheader-subtitle">
            Terminal Kasir Eksekutif • Transaksi Berkecepatan Tinggi Offline-First
          </div>
        </div>

        <div className="subheader-right-info">
          <div className="db-status-pill">
            <span className="sync-dot"></span>
            <span>Offline Mode — Transaksi tersimpan lokal di SQLite</span>
          </div>
          <div className="session-id-pill">
            <span>ID Sesi: {settings.terminalId}</span>
          </div>
        </div>
      </div>

      {/* POS Terminal Split View */}
      <div className="pos-view-container">
        {/* Main Product Selection Area */}
        <section className="pos-main-section">
          <SearchBar />
          <CategoryBar />
          <ProductGrid />
        </section>

        {/* Cart Side Area */}
        <CartPanel />
      </div>
    </div>
  );
};
