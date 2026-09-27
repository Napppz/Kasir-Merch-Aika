import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CreditCard, 
  QrCode, 
  Banknote, 
  Building2, 
  X, 
  Check, 
  ArrowLeft,
  RotateCcw,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import type { PaymentMethod, Transaction } from '../../types';
import { formatRupiah, generateInvoiceNumber } from '../../utils/formatters';
import { ThermalReceipt } from './ThermalReceipt';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartTotalQty,
    cartSubtotal,
    discountAmount,
    cartTotalAmount,
    settings,
    transactionNote,
    transactions,
    isCheckoutOpen,
    checkoutInitialCash,
    closeCheckout,
    processPayment,
  } = usePos();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(cartTotalAmount);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);
  const [showQrisZoom, setShowQrisZoom] = useState<boolean>(false);

  // Initialize cash received (use preset quick cash if triggered from POS cart, else exact amount)
  useEffect(() => {
    if (isCheckoutOpen) {
      setCashReceived(checkoutInitialCash !== null && checkoutInitialCash !== undefined ? checkoutInitialCash : cartTotalAmount);
      setCompletedTx(null);
      setShowQrisZoom(false);
    }
  }, [isCheckoutOpen, cartTotalAmount, checkoutInitialCash]);

  const changeAmount = Math.max(0, cashReceived - cartTotalAmount);
  const isCashInsufficient = paymentMethod === 'cash' && cashReceived < cartTotalAmount;

  // Handle confirming payment
  const handleConfirm = useCallback(async () => {
    if (isCashInsufficient || isProcessing) return;
    setIsProcessing(true);
    try {
      const finalAmount = paymentMethod === 'cash' ? cashReceived : cartTotalAmount;
      const tx = await processPayment(paymentMethod, finalAmount);
      setCompletedTx(tx);
    } catch (err) {
      console.error('Payment error', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isCashInsufficient, isProcessing, paymentMethod, cashReceived, cartTotalAmount, processPayment]);

  // Keyboard shortcut listener inside modal:
  // Key '1' -> Cash, '2' -> QRIS, '3' -> Transfer, Enter -> Confirm
  useEffect(() => {
    if (!isCheckoutOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (showQrisZoom) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowQrisZoom(false);
        }
        return;
      }

      if (completedTx) {
        if (e.key === 'F1' || e.key === 'Escape') {
          e.preventDefault();
          closeCheckout();
        }
        return;
      }

      if (e.key === '1' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setPaymentMethod('cash');
      } else if (e.key === '2' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setPaymentMethod('qris');
        setCashReceived(cartTotalAmount);
      } else if (e.key === '3' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setPaymentMethod('transfer');
        setCashReceived(cartTotalAmount);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleModalKeyDown);
    return () => window.removeEventListener('keydown', handleModalKeyDown);
  }, [isCheckoutOpen, completedTx, showQrisZoom, cartTotalAmount, handleConfirm, closeCheckout]);

  // Dynamic thumb-friendly quick cash options (supports admin custom presets from settings)
  const quickCashOptions = useMemo(() => {
    const list: { label: string; amount: number; hint: string; isExact?: boolean }[] = [
      {
        label: 'Uang Pas',
        amount: cartTotalAmount,
        hint: 'Kembalian Rp 0',
        isExact: true,
      },
    ];

    // If custom denominations set in settings, add those greater than cartTotalAmount
    if (settings.quickCashAmounts && settings.quickCashAmounts.length > 0) {
      const customOptions = settings.quickCashAmounts
        .filter((amt) => amt > cartTotalAmount)
        .sort((a, b) => a - b);

      for (const amt of customOptions) {
        list.push({
          label: formatRupiah(amt, true, false),
          amount: amt,
          hint: `Kembalian ${formatRupiah(amt - cartTotalAmount, true, false)}`,
        });
      }
    }

    // If only "Uang Pas" or less than 3 options, calculate smart rounded suggestions
    if (list.length < 3) {
      const next50k = Math.ceil(cartTotalAmount / 50000) * 50000;
      if (next50k > cartTotalAmount && !list.some((o) => o.amount === next50k)) {
        list.push({
          label: formatRupiah(next50k, true, false),
          amount: next50k,
          hint: `Kembalian ${formatRupiah(next50k - cartTotalAmount, true, false)}`,
        });
      }

      const next100k = Math.ceil(cartTotalAmount / 100000) * 100000;
      if (next100k > cartTotalAmount && !list.some((o) => o.amount === next100k)) {
        list.push({
          label: formatRupiah(next100k, true, false),
          amount: next100k,
          hint: `Kembalian ${formatRupiah(next100k - cartTotalAmount, true, false)}`,
        });
      }

      const next200k = Math.ceil(cartTotalAmount / 200000) * 200000;
      if (next200k > cartTotalAmount && !list.some((o) => o.amount === next200k)) {
        list.push({
          label: formatRupiah(next200k, true, false),
          amount: next200k,
          hint: `Kembalian ${formatRupiah(next200k - cartTotalAmount, true, false)}`,
        });
      }
    }

    return list.slice(0, 5);
  }, [cartTotalAmount, settings.quickCashAmounts]);

  if (!isCheckoutOpen) return null;

  // Live draft preview transaction if not yet confirmed
  const draftTx: Transaction = completedTx || {
    id: 'tx-draft',
    transactionNumber: generateInvoiceNumber(transactions.length + 1),
    transactionDate: new Date().toISOString(),
    subtotal: cartSubtotal,
    discount: discountAmount,
    total: cartTotalAmount,
    paymentAmount: paymentMethod === 'cash' ? cashReceived : cartTotalAmount,
    changeAmount: changeAmount,
    paymentMethod: paymentMethod,
    cashierName: `${settings.cashierName} (${settings.cashierId})`,
    status: 'success',
    notes: transactionNote || undefined,
    items: cart.map((c, i) => ({
      id: `draft-${i}`,
      transactionId: 'tx-draft',
      productId: c.product.id,
      productName: c.product.name,
      sku: c.product.sku,
      price: c.product.price,
      quantity: c.quantity,
      subtotal: c.product.price * c.quantity,
      image: c.product.image,
    })),
  };

  return (
    <>
      <div className="modal-overlay" onClick={closeCheckout}>
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className={`checkout-modal-body ${completedTx ? 'tx-completed' : ''}`}>
          {/* Left Column: Payment Config & Details */}
          <div className="checkout-payment-side">
            {/* Modal Header */}
            <div className="modal-header-row">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                      Checkout & Pembayaran
                    </h2>
                    <span className="fastpay-badge">FAST-PAY</span>
                  </div>
                  <div className="modal-meta-row">
                    <span style={{ color: 'var(--cyan)' }}>#{draftTx.transactionNumber}</span>
                    <span>•</span>
                    <span>👤 Kasir: {settings.cashierName} ({settings.cashierId})</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCheckout}
                style={{ color: 'var(--text-dim)', padding: '6px' }}
                title="Tutup (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items Summary & Total Hero */}
            <div className="checkout-items-and-total-grid">
              {/* Items Card */}
              <div className="checkout-items-summary-card">
                <div>
                  <div className="cis-header">
                    <span>RINCIAN ITEM ({cart.length} MACAM)</span>
                    <span>QTY: {cartTotalQty} PCS</span>
                  </div>

                  <div style={{ maxHeight: '110px', overflowY: 'auto' }}>
                    {cart.map((item) => (
                      <div key={item.product.id} className="cis-item-row">
                        <img src={item.product.image} alt="" className="cis-thumb" />
                        <div className="cis-name" title={item.product.name}>
                          {item.product.name}
                        </div>
                        <div className="cis-calc">
                          {item.quantity} x {formatRupiah(item.product.price, true, false)}
                        </div>
                        <div className="cis-sub">
                          {formatRupiah(item.product.price * item.quantity, true, false)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <span>Subtotal: {formatRupiah(cartSubtotal, true, false)}</span>
                  <span>Diskon: {formatRupiah(discountAmount, true, false)}</span>
                </div>
              </div>

              {/* Total Hero Card */}
              <div className="checkout-total-hero-card">
                <span className="cth-label">TOTAL PEMBAYARAN</span>
                <div className="cth-amount">
                  {formatRupiah(cartTotalAmount, true, false)}
                </div>
                <span className="cth-pill">● Tagihan Pas {cartTotalQty} Item</span>
              </div>
            </div>

            {/* Payment Methods Selection */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  METODE PEMBAYARAN
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  Gunakan tombol angka 1, 2, 3 atau Tab
                </span>
              </div>

              <div className="payment-methods-grid">
                {/* 1. Cash */}
                <div
                  className={`payment-method-card ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <span className="pm-badge-number">1</span>
                  <Banknote size={22} className="pm-icon" />
                  <span className="pm-title">Tunai / Cash</span>
                  <span className="pm-desc">Uang Fisik Kasir</span>
                </div>

                {/* 2. QRIS */}
                <div
                  className={`payment-method-card ${paymentMethod === 'qris' ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('qris');
                    setCashReceived(cartTotalAmount);
                  }}
                >
                  <span className="pm-badge-number">2</span>
                  <QrCode size={22} className="pm-icon" />
                  <span className="pm-title">QRIS Statis</span>
                  <span className="pm-desc">BCA / GoPay / Shopee</span>
                </div>

                {/* 3. Transfer */}
                <div
                  className={`payment-method-card ${paymentMethod === 'transfer' ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('transfer');
                    setCashReceived(cartTotalAmount);
                  }}
                >
                  <span className="pm-badge-number">3</span>
                  <Building2 size={22} className="pm-icon" />
                  <span className="pm-title">Transfer Bank</span>
                  <span className="pm-desc">BCA / Mandiri Booth</span>
                </div>
              </div>
            </div>

            {/* Cash Input & Quick Amounts (If Cash) */}
            {paymentMethod === 'cash' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Jumlah Uang Diterima Pelanggan
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                    Frek. Uang Populer
                  </span>
                </div>

                <div className="cash-input-box">
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-dim)', marginRight: '6px' }}>
                    Rp
                  </span>
                  <input
                    type="number"
                    className="cash-input-field"
                    value={cashReceived || ''}
                    min="0"
                    step="1000"
                    placeholder="0"
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Math.max(0, Math.floor(Number(e.target.value) || 0));
                      setCashReceived(val);
                    }}
                  />
                  <button
                    type="button"
                    className="cash-clear-btn"
                    onClick={() => setCashReceived(0)}
                  >
                    Clear
                  </button>
                </div>

                {/* Insufficient Cash Warning Callout */}
                {isCashInsufficient && cashReceived > 0 && (
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#f87171', 
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    marginTop: '8px', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}>
                    <AlertCircle size={15} />
                    <span>⚠️ Uang kurang: {formatRupiah(cartTotalAmount - cashReceived, true, false)}</span>
                  </div>
                )}

                {/* Quick Cash Suggestions - Thumb Friendly */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                    gap: '8px',
                    marginTop: '10px',
                  }}
                >
                  {quickCashOptions.map((opt, idx) => {
                    const isSelected = cashReceived === opt.amount;
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="quick-cash-btn"
                        style={{
                          minHeight: '52px',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '2px',
                          border: isSelected ? '2px solid var(--pink)' : opt.isExact ? '1.5px solid rgba(6, 182, 212, 0.5)' : '1px solid var(--border-muted)',
                          background: isSelected ? 'rgba(236, 72, 153, 0.18)' : opt.isExact ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-card)',
                          boxShadow: isSelected ? '0 0 12px rgba(236, 72, 153, 0.35)' : undefined,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                        }}
                        onClick={() => setCashReceived(opt.amount)}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#ffffff' : opt.isExact ? 'var(--cyan)' : '#ffffff' }}>
                          {opt.label}
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: isSelected ? 'var(--pink)' : '#34d399' }}>
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QRIS Official Card Display (If QRIS) */}
            {paymentMethod === 'qris' && (
              <div className="qris-checkout-container">
                {/* Customer-Facing Prompt Banner */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(129, 140, 248, 0.2))',
                    border: '1px solid rgba(236, 72, 153, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 12px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#f472b6',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <Smartphone size={16} />
                  <span>📱 Tunjukkan Layar Ini ke Pembeli untuk di-Scan</span>
                </div>

                <div className="qris-card-wrapper">
                  {/* QR Preview Thumbnail */}
                  <div 
                    className="qris-image-preview-box" 
                    onClick={() => setShowQrisZoom(true)}
                    title="Klik untuk memperbesar tampilan QRIS"
                  >
                    <img
                      src={settings.qrisImageUrl || '/qris.png'}
                      alt="QRIS Aika Sesilia"
                      className="qris-img"
                    />
                    <div className="qris-zoom-badge">
                      <Maximize2 size={11} />
                      <span>Perbesar</span>
                    </div>
                  </div>

                  {/* Merchant & Payment Info */}
                  <div className="qris-details-box">
                    <div className="qris-merchant-badge">
                      <span className="qris-tag">QRIS STATIS RESMI</span>
                      <span className="qris-verified-badge">
                        <CheckCircle2 size={13} color="#10b981" /> Terverifikasi
                      </span>
                    </div>

                    <div className="qris-merchant-name">
                      {settings.qrisMerchantName || 'AIKA SESILIA'}
                    </div>

                    <div className="qris-meta-row">
                      <span>NMID:</span>
                      <span className="qris-meta-val">{settings.qrisNmid || 'ID1025440784557'}</span>
                      <span>•</span>
                      <span>Stand:</span>
                      <span className="qris-meta-val">{settings.qrisTerminalCode || 'A01'}</span>
                    </div>

                    <div className="qris-amount-due-highlight">
                      <div className="qad-label">Nominal Harus Ditransfer Pelanggan:</div>
                      <div className="qad-amount">{formatRupiah(cartTotalAmount, true, false)}</div>
                      <div className="qad-sub">Uang pas (bebas biaya admin dari semua e-wallet / m-Banking)</div>
                    </div>

                    <button
                      type="button"
                      className="qris-fullscreen-btn"
                      onClick={() => setShowQrisZoom(true)}
                    >
                      <Smartphone size={13} />
                      <Maximize2 size={13} />
                      <span>Tampilkan QRIS Layar Penuh ke Pembeli</span>
                    </button>
                  </div>
                </div>

                {/* Verification Notice for Cashier */}
                <div className="qris-cashier-alert">
                  <ShieldCheck size={18} color="#38bdf8" style={{ minWidth: 18, marginTop: 2 }} />
                  <div>
                    <strong>VERIFIKASI KASIR:</strong> Minta pembeli menunjukkan bukti pembayaran bertuliskan nama merchant <strong>{settings.qrisMerchantName || 'AIKA SESILIA'}</strong> dengan nominal pas <strong>{formatRupiah(cartTotalAmount, true, false)}</strong> sebelum mengonfirmasi pembayaran.
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Card Display (If Transfer) */}
            {paymentMethod === 'transfer' && (
              <div className="transfer-checkout-container">
                <div className="transfer-card">
                  <div className="transfer-bank-logo">
                    <Building2 size={22} color="#818cf8" />
                    <span className="transfer-bank-name">Transfer Rekening Booth</span>
                  </div>
                  <div className="transfer-acc-info">
                    <div className="transfer-acc-num">BCA: 883-092-1920</div>
                    <div className="transfer-acc-holder">Atas Nama: {settings.qrisMerchantName || 'AIKA SESILIA'}</div>
                    <div className="transfer-acc-amount">Nominal Transfer: {formatRupiah(cartTotalAmount, true, false)}</div>
                  </div>
                  <div className="transfer-note">
                    Kasir: Periksa notifikasi mutasi rekening di ponsel booth sebelum menyelesaikan transaksi.
                  </div>
                </div>
              </div>
            )}

            {/* Kembalian / Status Box - Giant Display */}
            {paymentMethod === 'cash' ? (
              isCashInsufficient ? (
                <div 
                  className="change-due-box" 
                  style={{ 
                    borderColor: 'rgba(239, 68, 68, 0.7)', 
                    background: 'rgba(239, 68, 68, 0.12)',
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)',
                    padding: '16px 20px',
                  }}
                >
                  <div className="cd-left">
                    <div className="cd-icon" style={{ background: '#ef4444', color: '#ffffff' }}>
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <div className="cd-label" style={{ color: '#f87171', fontWeight: 800 }}>⚠️ UANG MASIH KURANG</div>
                      <div className="cd-amount" style={{ color: '#ffffff', fontSize: '32px', fontWeight: 900 }}>
                        - {formatRupiah(cartTotalAmount - cashReceived, true, false)}
                      </div>
                    </div>
                  </div>

                  <div className="cd-drawer-status" style={{ color: '#fca5a5', fontWeight: 700 }}>
                    <span>Kasir: Minta kekurangan uang tunai dari pembeli</span>
                  </div>
                </div>
              ) : (
                <div 
                  className="change-due-box"
                  style={{
                    borderColor: 'rgba(16, 185, 129, 0.75)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(6, 182, 212, 0.18))',
                    boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
                    padding: '16px 20px',
                  }}
                >
                  <div className="cd-left">
                    <div className="cd-icon" style={{ background: '#10b981', color: '#ffffff' }}>
                      <RotateCcw size={24} />
                    </div>
                    <div>
                      <div className="cd-label" style={{ color: '#34d399', fontWeight: 800, fontSize: '13px' }}>
                        UANG KEMBALIAN PEMBELI
                      </div>
                      <div 
                        className="cd-amount" 
                        style={{ 
                          color: '#ffffff', 
                          fontSize: '36px', 
                          fontWeight: 900, 
                          textShadow: '0 0 20px rgba(52, 211, 153, 0.6)' 
                        }}
                      >
                        {formatRupiah(changeAmount, true, false)}
                      </div>
                    </div>
                  </div>

                  <div className="cd-drawer-status" style={{ color: '#a7f3d0', fontWeight: 700 }}>
                    {changeAmount === 0 ? (
                      <span>✅ Uang Pas Diterima (Tanpa Kembalian)</span>
                    ) : (
                      <span>💵 Serahkan uang kembalian ke pembeli</span>
                    )}
                  </div>
                </div>
              )
            ) : paymentMethod === 'qris' ? (
              <div 
                className="change-due-box" 
                style={{ 
                  borderColor: 'rgba(236, 72, 153, 0.5)', 
                  background: 'rgba(236, 72, 153, 0.12)',
                  boxShadow: '0 0 25px rgba(236, 72, 153, 0.25)',
                  padding: '16px 20px',
                }}
              >
                <div className="cd-left">
                  <div className="cd-icon" style={{ background: 'var(--pink)', color: '#ffffff' }}>
                    <QrCode size={24} />
                  </div>
                  <div>
                    <div className="cd-label" style={{ color: 'var(--pink)', fontWeight: 800 }}>PEMBAYARAN QRIS</div>
                    <div className="cd-amount" style={{ color: '#ffffff', fontSize: '32px', fontWeight: 900, textShadow: '0 0 20px rgba(236, 72, 153, 0.5)' }}>
                      {formatRupiah(cartTotalAmount, true, false)}
                    </div>
                  </div>
                </div>

                <div className="cd-drawer-status" style={{ color: '#f472b6', fontWeight: 700 }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>QRIS Pas (Tanpa Kembalian)</span>
                </div>
              </div>
            ) : (
              <div 
                className="change-due-box" 
                style={{ 
                  borderColor: 'rgba(129, 140, 248, 0.5)', 
                  background: 'rgba(129, 140, 248, 0.12)',
                  padding: '16px 20px',
                }}
              >
                <div className="cd-left">
                  <div className="cd-icon" style={{ background: '#6366f1', color: '#ffffff' }}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="cd-label" style={{ color: '#818cf8', fontWeight: 800 }}>TRANSFER BANK</div>
                    <div className="cd-amount" style={{ color: '#ffffff', fontSize: '32px', fontWeight: 900 }}>
                      {formatRupiah(cartTotalAmount, true, false)}
                    </div>
                  </div>
                </div>

                <div className="cd-drawer-status" style={{ color: '#a5b4fc', fontWeight: 700 }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>Transfer Pas (Tanpa Kembalian)</span>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="modal-bottom-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={closeCheckout}
              >
                <ArrowLeft size={14} />
                <span>Batal</span>
              </button>

              <button
                type="button"
                className="modal-confirm-pay-btn"
                disabled={isCashInsufficient || isProcessing || completedTx !== null}
                onClick={handleConfirm}
                style={
                  paymentMethod === 'qris'
                    ? { background: 'linear-gradient(135deg, #db2777, #ec4899)', boxShadow: '0 0 20px rgba(236, 72, 153, 0.5)' }
                    : undefined
                }
              >
                {completedTx ? (
                  <>
                    <Check size={18} />
                    <span>Transaksi Berhasil Disimpan!</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <span>Memproses Transaksi...</span>
                  </>
                ) : isCashInsufficient ? (
                  <>
                    <AlertCircle size={18} />
                    <span>Uang Masih Kurang ({formatRupiah(cartTotalAmount - cashReceived, true, false)})</span>
                  </>
                ) : paymentMethod === 'qris' ? (
                  <>
                    <Check size={20} />
                    <span>✅ Pembeli Sudah Scan & Bayar ({formatRupiah(cartTotalAmount, true, false)})</span>
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    <span>Konfirmasi Pembayaran & Cetak Struk</span>
                    <span className="key-badge" style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}>
                      Enter ↵
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: 80mm Thermal Receipt Preview */}
          <div className="checkout-receipt-side">
            <ThermalReceipt
              transaction={draftTx}
              settings={settings}
              onNewTransaction={() => closeCheckout()}
            />
          </div>
        </div>
      </div>
    </div>

    {/* QRIS Fullscreen Zoom Lightbox Overlay */}
    {showQrisZoom && (
      <div className="qris-zoom-overlay" onClick={() => setShowQrisZoom(false)}>
        <div className="qris-zoom-card" onClick={(e) => e.stopPropagation()}>
          <div className="qris-zoom-header">
            <div>
              <div className="qzh-merchant">{settings.qrisMerchantName || 'AIKA SESILIA'}</div>
              <div className="qzh-nmid">
                NMID: {settings.qrisNmid || 'ID1025440784557'} • Stand {settings.qrisTerminalCode || 'A01'}
              </div>
            </div>
            <button
              type="button"
              className="qzh-close-btn"
              onClick={() => setShowQrisZoom(false)}
              title="Tutup (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          <div className="qris-zoom-image-wrapper">
            <img
              src={settings.qrisImageUrl || '/qris.png'}
              alt="QRIS Standar Pembayaran Nasional - AIKA SESILIA"
              className="qris-zoom-img"
            />
          </div>

          <div className="qris-zoom-footer">
            <div className="qzf-amount-label">NOMINAL PEMBAYARAN:</div>
            <div className="qzf-amount-val">{formatRupiah(cartTotalAmount, true, false)}</div>
            <div className="qzf-apps-note">
              Scan dengan GoPay, OVO, BCA Mobile, ShopeePay, DANA, Livin', atau m-Banking apapun
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
