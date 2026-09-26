import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, X, Ticket, FileText, Banknote, ArrowRight } from 'lucide-react';
import { usePos } from '../../context/PosContext';
import { formatRupiah } from '../../utils/formatters';

export const CartPanel: React.FC = () => {
  const {
    cart,
    cartTotalQty,
    cartSubtotal,
    discountAmount,
    discountCode,
    cartTotalAmount,
    transactionNote,
    setTransactionNote,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    applyDiscountCode,
    openCheckout,
  } = usePos();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const success = applyDiscountCode(inputCoupon);
    if (success) {
      setCouponFeedback('Diskon berhasil diterapkan!');
    } else {
      setCouponFeedback('Kode diskon tidak valid (Gunakan COMICFEST)');
    }
    setTimeout(() => setCouponFeedback(null), 3000);
  };

  // Quick cash calculations based on cartTotalAmount
  const getQuickCashSuggestions = () => {
    if (cartTotalAmount <= 0) return [];
    const suggestions: { label: string; amount: number; change: number }[] = [];

    // 1. Uang Pas
    suggestions.push({
      label: 'Uang Pas',
      amount: cartTotalAmount,
      change: 0,
    });

    // 2. Next 50k / 100k
    const next50k = Math.ceil(cartTotalAmount / 50000) * 50000;
    const secondOption = next50k === cartTotalAmount ? next50k + 50000 : next50k;
    suggestions.push({
      label: formatRupiah(secondOption, true, false),
      amount: secondOption,
      change: secondOption - cartTotalAmount,
    });

    // 3. Next 100k
    const next100k = Math.ceil((secondOption + 1000) / 100000) * 100000;
    const thirdOption = next100k <= secondOption ? secondOption + 50000 : next100k;
    suggestions.push({
      label: formatRupiah(thirdOption, true, false),
      amount: thirdOption,
      change: thirdOption - cartTotalAmount,
    });

    return suggestions;
  };

  const quickCashList = getQuickCashSuggestions();

  return (
    <aside className="cart-panel">
      {/* Header */}
      <div className="cart-header">
        <div className="cart-title-wrapper">
          <ShoppingCart size={18} className="cart-icon" />
          <h2 className="cart-title">Keranjang Belanja</h2>
          <span className="cart-badge">
            {cart.length} Item ({cartTotalQty} Qty)
          </span>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            className="cart-clear-btn"
            onClick={clearCart}
            title="Kosongkan seluruh item keranjang"
          >
            [Kosongkan]
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="cart-items-container">
        {cart.length > 0 ? (
          cart.map((item) => {
            const lineSubtotal = item.product.price * item.quantity;
            return (
              <div key={item.product.id} className="cart-item-row">
                <div className="cart-item-info">
                  <div className="cart-item-title" title={item.product.name}>
                    {item.product.name}
                  </div>
                  <div className="cart-item-unit-price">
                    @ {formatRupiah(item.product.price, true, false)}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="cart-item-stepper">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    title="Kurang Qty"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="stepper-val">{item.quantity}</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    title="Tambah Qty"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <div className="cart-item-subtotal">
                  {formatRupiah(lineSubtotal, true, false)}
                </div>

                <button
                  type="button"
                  className="cart-item-remove-btn"
                  onClick={() => removeFromCart(item.product.id)}
                  title="Hapus dari keranjang"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })
        ) : (
          <div className="cart-empty-state">
            <ShoppingCart size={36} color="var(--text-dim)" />
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Keranjang Masih Kosong
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '200px' }}>
              Klik produk di katalog atau tekan <strong>F2</strong> untuk scan barcode dummy.
            </div>
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <div className="cart-footer">
        {/* Voucher input */}
        <form onSubmit={handleApplyCoupon} className="cart-input-row">
          <Ticket size={14} color="var(--text-dim)" />
          <input
            type="text"
            placeholder={discountCode ? `Kode: ${discountCode}` : 'Kode Voucher / Diskon Event'}
            value={inputCoupon}
            onChange={(e) => setInputCoupon(e.target.value)}
          />
          <button type="submit">Terapkan</button>
        </form>
        {couponFeedback && (
          <div
            style={{
              fontSize: '10px',
              color: couponFeedback.includes('berhasil') ? 'var(--cyan)' : '#f43f5e',
              paddingLeft: '4px',
            }}
          >
            {couponFeedback}
          </div>
        )}

        {/* Transaction note input */}
        <div className="cart-input-row">
          <FileText size={14} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Catatan Transaksi (cth: Titipan Booth C-04)"
            value={transactionNote}
            onChange={(e) => setTransactionNote(e.target.value)}
          />
        </div>

        {/* Subtotal & Total */}
        <div className="cart-summary-group">
          <div className="summary-row">
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {formatRupiah(cartSubtotal, true, false)}
            </span>
          </div>

          <div className="summary-row">
            <span>Diskon Event</span>
            <span style={{ color: discountAmount > 0 ? '#34d399' : 'var(--text-dim)' }}>
              -{formatRupiah(discountAmount, true, false)}
            </span>
          </div>

          <div className="summary-row total-row">
            <span className="total-tagihan-title">TOTAL TAGIHAN</span>
            <span className="total-tagihan-value">
              {formatRupiah(cartTotalAmount, true, false)}
            </span>
          </div>
        </div>

        {/* Quick cash suggestions */}
        {cart.length > 0 && (
          <div className="quick-cash-row">
            {quickCashList.map((qc, i) => (
              <button
                key={i}
                type="button"
                className="quick-cash-btn"
                onClick={openCheckout}
              >
                <span className="qc-label">
                  {i === 0 ? 'Uang Pas' : qc.label}
                </span>
                <span className="qc-val">
                  {i === 0
                    ? formatRupiah(qc.amount, true, false)
                    : `Kembali ${Math.round(qc.change / 1000)}k`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Checkout Button */}
        <button
          type="button"
          className="checkout-cta-btn"
          disabled={cart.length === 0}
          onClick={openCheckout}
        >
          <div style={{ display: 'flex', alignContent: 'center', alignItems: 'center', gap: '8px' }}>
            <Banknote size={20} />
            <span>BAYAR (F9)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{formatRupiah(cartTotalAmount, true, false)}</span>
            <ArrowRight size={18} />
          </div>
        </button>

        {/* Hint Row */}
        <div className="checkout-hint-row">
          <span>Tekan Enter atau F9 untuk buka modal bayar</span>
          <span style={{ color: 'var(--cyan)' }}>Auto-Print On ●</span>
        </div>
      </div>
    </aside>
  );
};
