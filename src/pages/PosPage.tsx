import React from 'react';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { SearchBar } from '../components/pos/SearchBar';
import { CategoryBar } from '../components/pos/CategoryBar';
import { ProductGrid } from '../components/pos/ProductGrid';
import { CartPanel } from '../components/pos/CartPanel';
import { formatRupiah } from '../utils/formatters';

interface PosPageProps {
  mobileTab?: 'catalog' | 'cart';
  onTabChange?: (tab: 'catalog' | 'cart') => void;
}

export const PosPage: React.FC<PosPageProps> = ({ 
  mobileTab = 'catalog', 
  onTabChange 
}) => {
  const { settings, cartTotalQty, cartTotalAmount } = usePos();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <div className="page-subheader">
        <div className="subheader-title-group">
          <h2>
            <ShoppingBag size={20} color="var(--primary-light)" />
            <span>Kasir POS Booth</span>
            <span className="event-tag-badge">{settings.eventName || 'COMIC FEST 2026'}</span>
          </h2>
          <div className="subheader-subtitle">
            Pilih merchandise, masukkan ke keranjang, dan proses pembayaran cepat
          </div>
        </div>

        <div className="subheader-right-info">
          <div className="db-status-pill" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.28)', color: '#34d399' }}>
            <span className="sync-dot" style={{ background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
            <span>Kasir Siap • Data Tersimpan di HP</span>
          </div>
          <div className="session-id-pill" style={{ color: 'var(--text-secondary)' }}>
            <span>👤 Kasir: {settings.cashierName}</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible on mobile <= 768px) */}
      <div className="mobile-pos-tabs">
        <button
          type="button"
          className={`mobile-pos-tab-btn ${mobileTab === 'catalog' ? 'active' : ''}`}
          onClick={() => onTabChange?.('catalog')}
        >
          <span>Katalog Produk</span>
        </button>
        <button
          type="button"
          className={`mobile-pos-tab-btn ${mobileTab === 'cart' ? 'active' : ''}`}
          onClick={() => onTabChange?.('cart')}
        >
          <ShoppingCart size={15} />
          <span>Keranjang ({cartTotalQty})</span>
          {cartTotalAmount > 0 && (
            <span className="mobile-tab-amount">
              {formatRupiah(cartTotalAmount, true, false)}
            </span>
          )}
        </button>
      </div>

      {/* POS Terminal Split View */}
      <div className={`pos-view-container ${mobileTab === 'cart' ? 'show-cart-mobile' : 'show-catalog-mobile'}`}>
        {/* Main Product Selection Area */}
        <section className="pos-main-section">
          <SearchBar />
          <CategoryBar />
          <ProductGrid />

          {/* Sticky floating cart bar on mobile when items in cart */}
          {cartTotalQty > 0 && (
            <div className="mobile-floating-cart-bar">
              <div className="mobile-cart-summary">
                <span className="mobile-cart-count">{cartTotalQty} Item</span>
                <span className="mobile-cart-total">{formatRupiah(cartTotalAmount)}</span>
              </div>
              <button 
                type="button" 
                className="mobile-view-cart-btn"
                onClick={() => onTabChange?.('cart')}
              >
                <span>Lihat Keranjang</span>
                <ShoppingCart size={16} />
              </button>
            </div>
          )}
        </section>

        {/* Cart Side Area */}
        <CartPanel onBackToCatalog={() => onTabChange?.('catalog')} />
      </div>
    </div>
  );
};
