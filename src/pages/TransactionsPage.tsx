import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Download, 
  Printer, 
  Eye, 
  Calendar, 
  RotateCcw,
  CloudOff
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { TransactionDetailModal } from '../components/transactions/TransactionDetailModal';
import { 
  resolveDateRange, 
  isDateInRange, 
  getSalesSummary, 
  isCompletedTransaction, 
  exportDataToCSV,
  type DateRangePreset 
} from '../services/reportService';
import type { Transaction } from '../types';

export const TransactionsPage: React.FC = () => {
  const { transactions, openReceiptModal } = usePos();

  // Selected Transaction for Detail Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');

  // Active Date Range Resolver
  const activeDateRange = useMemo(() => {
    return resolveDateRange(datePreset, customStartDate, customEndDate);
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered Transactions (Real-time, Client-side)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Date Range
      if (!isDateInRange(tx.transactionDate, activeDateRange)) {
        return false;
      }

      // 2. Payment Method
      if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        const isComp = isCompletedTransaction(tx);
        if (statusFilter === 'completed' && !isComp) return false;
        if (statusFilter === 'cancelled' && isComp) return false;
      }

      // 4. Amount Range
      const parsedMin = parseFloat(minAmount);
      const parsedMax = parseFloat(maxAmount);
      if (!isNaN(parsedMin) && tx.total < parsedMin) return false;
      if (!isNaN(parsedMax) && tx.total > parsedMax) return false;

      // 5. Search Query (Invoice, Cashier, or Product Name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchInvoice = tx.transactionNumber.toLowerCase().includes(q);
        const matchCashier = tx.cashierName.toLowerCase().includes(q);
        const matchProduct = tx.items.some(i => i.productName.toLowerCase().includes(q) || (i.sku && i.sku.toLowerCase().includes(q)));
        if (!matchInvoice && !matchCashier && !matchProduct) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, activeDateRange, paymentFilter, statusFilter, minAmount, maxAmount, searchQuery]);

  // Transaction Summary Cards (BAGIAN 7)
  const summary = useMemo(() => {
    return getSalesSummary(filteredTransactions);
  }, [filteredTransactions]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setPaymentFilter('all');
    setStatusFilter('all');
    setMinAmount('');
    setMaxAmount('');
  };

  const handleExportCSV = () => {
    const rangeLabel = datePreset === 'custom' && customStartDate && customEndDate 
      ? `${customStartDate}_to_${customEndDate}` 
      : datePreset;
    exportDataToCSV('transactions', filteredTransactions, rangeLabel);
  };

  const getMethodBadge = (m: string) => {
    switch (m.toLowerCase()) {
      case 'cash':
        return <span className="payment-method-badge cash">CASH</span>;
      case 'qris':
        return <span className="payment-method-badge qris">QRIS</span>;
      case 'transfer':
      default:
        return <span className="payment-method-badge transfer">TRANSFER</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <div className="page-subheader">
        <div className="subheader-title-group">
          <h2>
            <Receipt size={20} color="var(--cyan)" />
            <span>Riwayat & Manajemen Transaksi</span>
          </h2>
          <div className="subheader-subtitle">
            Daftar lengkap nota kasir offline, audit pembayaran, dan cetak ulang struk thermal
          </div>
        </div>

        {/* Global CSV Export Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid var(--cyan)',
              color: 'var(--cyan)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 12px var(--cyan-glow)',
            }}
          >
            <Download size={14} />
            <span>Export CSV Transaksi</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Date Presets Bar (BAGIAN 4) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>
            <Calendar size={13} color="var(--cyan)" />
            <span>Periode Transaksi:</span>
          </div>

          {[
            { id: 'all', label: 'Semua Periode' },
            { id: 'today', label: 'Hari Ini' },
            { id: 'yesterday', label: 'Kemarin' },
            { id: 'last7', label: '7 Hari Terakhir' },
            { id: 'last30', label: '30 Hari Terakhir' },
            { id: 'thisMonth', label: 'Bulan Ini' },
            { id: 'custom', label: 'Custom Range' },
          ].map(p => (
            <button
              type="button"
              key={p.id}
              onClick={() => setDatePreset(p.id as DateRangePreset)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                background: datePreset === p.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: datePreset === p.id ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${datePreset === p.id ? 'var(--primary)' : 'var(--border-subtle)'}`,
              }}
            >
              {p.label}
            </button>
          ))}

          {/* Custom Date Pickers */}
          {datePreset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  color: '#ffffff',
                  fontSize: '11px',
                }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  color: '#ffffff',
                  fontSize: '11px',
                }}
              />
            </div>
          )}
        </div>

        {/* 6 Transaction Summary Cards (BAGIAN 7) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {/* Total Transactions */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
              TOTAL TRANSAKSI
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {summary.totalTransactions} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>nota</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Status lunas</div>
          </div>

          {/* Gross Sales */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
              GROSS SALES (KOTOR)
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {formatRupiah(summary.grossSales, true, false)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sebelum diskon</div>
          </div>

          {/* Total Discount */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 700, letterSpacing: '0.5px' }}>
              TOTAL DISKON
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
              -{formatRupiah(summary.totalDiscount, true, false)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {summary.discountedTransactionsCount} nota promo
            </div>
          </div>

          {/* Net Sales */}
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 800, letterSpacing: '0.5px' }}>
              NET SALES (BERSIH)
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              {formatRupiah(summary.netSales, true, false)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Omzet kasir riil</div>
          </div>

          {/* Average Transaction */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
              AVERAGE TRANSACTION
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>
              {formatRupiah(summary.averageTransaction, true, false)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Rata-rata per nota</div>
          </div>

          {/* Items Sold */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
              MERCHANDISE SOLD
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {summary.totalItemsSold} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>pcs</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Total unit keluar</div>
          </div>
        </div>

        {/* Filter Toolbar (BAGIAN 2 & 3: Search, Payment, Status, Amount, Reset) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Query */}
          <div
            style={{
              flex: 1,
              minWidth: '240px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
            }}
          >
            <Search size={14} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Cari No. Invoice, Kasir, atau Nama Merchandise..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
          >
            <option value="all">Semua Metode Pembayaran</option>
            <option value="cash">Tunai (Cash)</option>
            <option value="qris">QRIS Statis</option>
            <option value="transfer">Transfer Bank</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
          >
            <option value="all">Semua Status</option>
            <option value="completed">Completed / Sukses</option>
            <option value="cancelled">Cancelled / Refund</option>
          </select>

          {/* Amount Range (Min - Max) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number"
              placeholder="Min Rp"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              style={{
                width: '80px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                color: '#ffffff',
                fontSize: '11px',
              }}
            />
            <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>-</span>
            <input
              type="number"
              placeholder="Max Rp"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value)}
              style={{
                width: '80px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 8px',
                color: '#ffffff',
                fontSize: '11px',
              }}
            />
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
            title="Reset semua filter"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>

        {/* Transactions Table (BAGIAN 1) */}
        <div
          className="data-table-wrapper"
          style={{
            flex: 1,
            overflowY: 'auto',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
          }}
        >
          {filteredTransactions.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <Receipt size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <div style={{ fontSize: '14px', fontWeight: 700 }}>Belum ada data transaksi yang cocok.</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Coba ubah kata kunci pencarian atau sesuaikan preset filter tanggal.
              </div>
            </div>
          ) : (
            <table className="cosplay-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ width: '150px' }}>No. Invoice</th>
                  <th style={{ width: '130px' }}>Tanggal & Jam</th>
                  <th>Kasir Bertugas</th>
                  <th>Rincian Item</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Metode</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>Total Belanja</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Status</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => {
                  const isCompleted = isCompletedTransaction(tx);
                  const itemsCount = tx.items.reduce((s, i) => s + i.quantity, 0);
                  const firstItem = tx.items[0];
                  const itemsSummary = tx.items.length === 1 
                    ? `${firstItem.quantity}x ${firstItem.productName}` 
                    : `${firstItem.quantity}x ${firstItem.productName} (+${tx.items.length - 1} item lainnya)`;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="inv-code" style={{ fontSize: '12px' }}>
                          {tx.transactionNumber}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {formatDateTime(tx.transactionDate)}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600 }}>
                          {tx.cashierName.split('(')[0].trim()}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {itemsSummary}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              color: 'var(--text-dim)',
                            }}
                          >
                            {itemsCount} pcs
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {getMethodBadge(tx.paymentMethod)}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: isCompleted ? '#ffffff' : 'var(--text-dim)' }}>
                          {formatRupiah(tx.total, true, false)}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isCompleted ? '#34d399' : '#f87171',
                            border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isCompleted ? 'COMPLETED' : 'CANCELLED'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedTx(tx);
                            }}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '4px',
                              color: 'var(--text-secondary)',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Eye size={12} />
                            <span>Detail</span>
                          </button>

                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              openReceiptModal(tx);
                            }}
                            title="Cetak Ulang Struk"
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(99, 102, 241, 0.12)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              borderRadius: '4px',
                              color: '#a5b4fc',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Printer size={12} />
                            <span>Struk</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Offline Security Footer Info */}
        <div
          style={{
            background: 'rgba(6, 182, 212, 0.05)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudOff size={15} color="var(--cyan)" />
            <span>
              <strong>IndexedDB Offline Storage Active</strong> — Seluruh nota transaksi dan snapshot harga tersimpan lokal di peramban ini.
            </span>
          </div>
          <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>
            {filteredTransactions.length} dari {transactions.length} Total Nota
          </span>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};
