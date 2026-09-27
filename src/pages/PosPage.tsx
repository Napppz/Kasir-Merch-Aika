import React from 'react';
import { ShoppingBag, ShoppingCart, Banknote } from 'lucide-react';
import { usePos } from '../context/PosContext';
import { SearchBar } from '../components/pos/SearchBar';
import { CategoryBar } from '../components/pos/CategoryBar';
import { ProductGrid } from '../components/pos/ProductGrid';
import { CartPanel } from '../components/pos/CartPanel';
import { RecentTransactionsMini } from '../components/pos/RecentTransactionsMini';
import { formatRupiah } from '../utils/formatters';

interface PosPageProps {
  mobileTab?: 'catalog' | 'cart';
  onTabChange?: (tab: 'catalog' | 'cart') => void;
}

export const PosPage: React.FC<PosPageProps> = ({
  mobileTab = 'catalog',
  onTabChange
}) => {
  const { settings, cartTotalQty, cartTotalAmount, openCheckout, openBoothModal } = usePos();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <div className={`page-subheader ${mobileTab === 'cart' ? 'hide-on-mobile-cart' : ''}`}>
        <div className="subheader-title-group">
          <h2>
            <ShoppingBag size={20} color="var(--primary-light)" />
            <span>Kasir Merch Aika</span>
            {settings.eventName ? (
              <button
                type="button"
                className="event-tag-badge event-tag-badge--clickable"
                onClick={openBoothModal}
                title={`Event: ${settings.eventName} (Klik untuk ubah)`}
              >
                {settings.eventName}
              </button>
            ) : (
              <button
                type="button"
                className="event-tag-badge event-tag-badge--empty"
                onClick={openBoothModal}
                title="Klik untuk menentukan event baru"
              >
                + Tentukan Event
              </button>
            )}
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
          <RecentTransactionsMini />
          <ProductGrid />

          {/* Sticky floating cart bar on mobile when items in cart */}
          {cartTotalQty > 0 && (
            <div className="mobile-floating-cart-bar">
              <div className="mobile-cart-summary">
                <span className="mobile-cart-count">{cartTotalQty} Item dipilih</span>
                <span className="mobile-cart-total">{formatRupiah(cartTotalAmount)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="mobile-view-cart-btn"
                  onClick={() => onTabChange?.('cart')}
                  title="Lihat Rincian Keranjang"
                >
                  <ShoppingCart size={14} />
                  <span>Rincian</span>
                </button>
                <button
                  type="button"
                  className="mobile-direct-pay-btn"
                  onClick={() => openCheckout()}
                  title="Bayar Sekarang"
                >
                  <Banknote size={15} />
                  <span>BAYAR</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Cart Side Area */}
        <CartPanel onBackToCatalog={() => onTabChange?.('catalog')} />
      </div>
    </div>
  );
};
