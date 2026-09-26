import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Award, 
  CreditCard, 
  Tag, 
  ArrowUpRight, 
  Layers, 
  Percent, 
  Sparkles, 
  ShoppingBag,
  SlidersHorizontal
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatRupiah } from '../utils/formatters';
import { 
  resolveDateRange, 
  isDateInRange, 
  getSalesSummary, 
  getHourlySales, 
  getDailySales, 
  getTopProducts, 
  getPaymentDistribution, 
  getCategorySales, 
  getProductPerformance, 
  exportDataToCSV, 
  type DateRangePreset
} from '../services/reportService';

type PerformanceSort = 'sales-desc' | 'qty-desc' | 'stock-asc' | 'name-asc';

export const ReportsPage: React.FC = () => {
  const { transactions, products, categories } = usePos();

  // Date Range state
  const [datePreset, setDatePreset] = useState<DateRangePreset>('today');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Month & Year state for Monthly report (Requirement 17 & 20)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Product performance table sort
  const [perfSort, setPerfSort] = useState<PerformanceSort>('sales-desc');
  const [topProductSort, setTopProductSort] = useState<'qty' | 'omzet'>('qty');

  // Chart view mode: 'hourly' | 'daily'
  const [chartView, setChartView] = useState<'hourly' | 'daily'>('hourly');

  // Resolve active date range (BAGIAN 18 & 20)
  const activeDateRange = useMemo(() => {
    if (datePreset === 'thisMonth') {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const start = `${selectedYear}-${monthStr}-01`;
      const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const end = `${selectedYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
      return { preset: 'thisMonth' as DateRangePreset, startDate: start, endDate: end };
    }
    return resolveDateRange(datePreset, customStart, customEnd);
  }, [datePreset, selectedMonth, selectedYear, customStart, customEnd]);

  // Filter transactions strictly for this range (BAGIAN 18 & 19)
  const rangeTransactions = useMemo(() => {
    return transactions.filter(tx => isDateInRange(tx.transactionDate, activeDateRange));
  }, [transactions, activeDateRange]);

  // Sales Summary (KPI Cards)
  const summary = useMemo(() => {
    return getSalesSummary(rangeTransactions);
  }, [rangeTransactions]);

  // Comparison logic for 'today' vs 'yesterday' (BAGIAN 9)
  const comparison = useMemo(() => {
    if (datePreset !== 'today') return null;

    const yRange = resolveDateRange('yesterday');
    const yesterdayTxs = transactions.filter(tx => isDateInRange(tx.transactionDate, yRange));
    const yesterdaySummary = getSalesSummary(yesterdayTxs);

    if (yesterdaySummary.totalTransactions === 0) {
      return { hasPriorData: false };
    }

    const salesDiff = summary.netSales - yesterdaySummary.netSales;
    const salesGrowthPct = yesterdaySummary.netSales > 0 
      ? Math.round((salesDiff / yesterdaySummary.netSales) * 100) 
      : 0;

    return {
      hasPriorData: true,
      yesterdaySales: yesterdaySummary.netSales,
      yesterdayTxs: yesterdaySummary.totalTransactions,
      salesGrowthPct,
      salesDiff,
    };
  }, [datePreset, transactions, summary]);

  // Hourly Sales
  const hourlyData = useMemo(() => {
    return getHourlySales(rangeTransactions);
  }, [rangeTransactions]);

  // Daily Sales
  const dailyData = useMemo(() => {
    return getDailySales(rangeTransactions, activeDateRange);
  }, [rangeTransactions, activeDateRange]);

  // Top Products (BAGIAN 12 & Requirement 16 & 19)
  const topProducts = useMemo(() => {
    const raw = getTopProducts(rangeTransactions, products, 10);
    const sorted = [...raw].sort((a, b) => {
      if (topProductSort === 'omzet') return b.revenue - a.revenue;
      return b.quantitySold - a.quantitySold;
    });
    return sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [rangeTransactions, products, topProductSort]);

  // Payment Distribution (BAGIAN 13)
  const paymentDist = useMemo(() => {
    return getPaymentDistribution(rangeTransactions);
  }, [rangeTransactions]);

  // Category Sales (BAGIAN 14)
  const categorySales = useMemo(() => {
    return getCategorySales(rangeTransactions, products, categories);
  }, [rangeTransactions, products, categories]);

  // Product Performance Table (BAGIAN 15)
  const productPerformance = useMemo(() => {
    const raw = getProductPerformance(rangeTransactions, products, categories);
    return [...raw].sort((a, b) => {
      if (perfSort === 'sales-desc') return b.revenue - a.revenue;
      if (perfSort === 'qty-desc') return b.unitsSold - a.unitsSold;
      if (perfSort === 'stock-asc') return a.currentStock - b.currentStock;
      if (perfSort === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [rangeTransactions, products, categories, perfSort]);

  // Max value calculation for bar chart rendering
  const maxHourlySales = useMemo(() => {
    const max = Math.max(...hourlyData.map(h => h.sales));
    return max > 0 ? max : 1;
  }, [hourlyData]);

  const maxDailySales = useMemo(() => {
    const max = Math.max(...dailyData.map(d => d.sales));
    return max > 0 ? max : 1;
  }, [dailyData]);

  // CSV Export (BAGIAN 17)
  const handleExportCSV = () => {
    const dateLabel = datePreset === 'custom' && customStart && customEnd
      ? `${customStart}_to_${customEnd}`
      : datePreset;
    exportDataToCSV('product_sales', productPerformance, dateLabel);
  };

  const handleExportCategoryCSV = () => {
    const dateLabel = datePreset === 'custom' && customStart && customEnd
      ? `${customStart}_to_${customEnd}`
      : datePreset;
    exportDataToCSV('sales_report', categorySales, dateLabel);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <div className="page-subheader">
        <div className="subheader-title-group">
          <h2>
            <BarChart3 size={20} color="var(--pink)" />
            <span>Laporan & Analisis Penjualan Booth</span>
          </h2>
          <div className="subheader-subtitle">
            Ringkasan omzet aktual, analisis pergerakan produk, performa kategori, dan distribusi kasir
          </div>
        </div>

        {/* Global CSV Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleExportCategoryCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>CSV Kategori</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'var(--pink-bg)',
              border: '1px solid var(--border-pink)',
              color: 'var(--pink)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(236, 72, 153, 0.25)',
            }}
          >
            <Download size={14} />
            <span>Export CSV Produk</span>
          </button>
        </div>
      </div>

      {/* Main Reporting Container */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Date Range Selector Bar (BAGIAN 4 & 18) */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>
              <Calendar size={13} color="var(--pink)" />
              <span>Rentang Laporan:</span>
            </div>

            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: 'thisMonth', label: 'Laporan Bulanan' },
              { id: 'last7', label: '7 Hari Terakhir' },
              { id: 'last30', label: '30 Hari Terakhir' },
              { id: 'all', label: 'Semua Waktu' },
              { id: 'custom', label: 'Custom' },
            ].map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  setDatePreset(p.id as DateRangePreset);
                  if (p.id === 'today' || p.id === 'yesterday') {
                    setChartView('hourly');
                  } else {
                    setChartView('daily');
                  }
                }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: datePreset === p.id ? 'var(--pink-bg)' : 'rgba(255, 255, 255, 0.04)',
                  color: datePreset === p.id ? 'var(--pink)' : 'var(--text-secondary)',
                  border: `1px solid ${datePreset === p.id ? 'var(--border-pink)' : 'var(--border-subtle)'}`,
                }}
              >
                {p.label}
              </button>
            ))}

            {datePreset === 'thisMonth' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
                  style={{
                    background: '#040810',
                    border: '1px solid var(--border-pink)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    color: 'var(--pink)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={idx} value={idx}>
                      {mName}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                  style={{
                    background: '#040810',
                    border: '1px solid var(--border-pink)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    color: 'var(--pink)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(yr => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {datePreset === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="date"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  style={{
                    background: '#040810',
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
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  style={{
                    background: '#040810',
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

          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            Rentang aktif: <strong style={{ color: '#ffffff' }}>{activeDateRange.startDate}</strong> s/d <strong style={{ color: '#ffffff' }}>{activeDateRange.endDate}</strong>
          </div>
        </div>

        {/* 4 Primary KPI Cards + Comparison (BAGIAN 9) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Today's / Period Sales */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.6px' }}>
                TOTAL NET SALES
              </span>
              <span style={{ color: 'var(--cyan)' }}>
                <TrendingUp size={16} />
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
              {formatRupiah(summary.netSales, true, false)}
            </div>

            {comparison && comparison.hasPriorData && comparison.salesDiff !== undefined ? (
              <div style={{ fontSize: '10px', color: comparison.salesDiff >= 0 ? '#34d399' : '#f43f5e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight size={12} style={{ transform: comparison.salesDiff >= 0 ? 'none' : 'rotate(90deg)' }} />
                <span>
                  {comparison.salesDiff >= 0 ? `+${comparison.salesGrowthPct}%` : `${comparison.salesGrowthPct}%`} dibanding kemarin ({formatRupiah(comparison.yesterdaySales || 0, true, false)})
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Omzet bersih setelah dikurangi diskon
              </div>
            )}
          </div>

          {/* Transactions Count */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.6px' }}>
                TOTAL TRANSAKSI
              </span>
              <span style={{ color: 'var(--primary-light)' }}>
                <ShoppingBag size={16} />
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
              {summary.totalTransactions} <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>nota</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Transaksi selesai (completed)
            </div>
          </div>

          {/* Items Sold */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.6px' }}>
                TOTAL UNIT TERJUAL
              </span>
              <span style={{ color: 'var(--pink)' }}>
                <Layers size={16} />
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--pink)' }}>
              {summary.totalItemsSold} <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>pcs</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Akumulasi merchandise fisik keluar
            </div>
          </div>

          {/* Average Basket */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.6px' }}>
                AVERAGE TRANSACTION
              </span>
              <span style={{ color: '#a5b4fc' }}>
                <Sparkles size={16} />
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>
              {formatRupiah(summary.averageTransaction, true, false)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Nilai belanja rata-rata per nota
            </div>
          </div>
        </div>

        {/* Section: Interactive Sales Charts (BAGIAN 10 & 11) */}
        <div className="dashboard-card" style={{ padding: '16px 20px' }}>
          <div className="db-card-header" style={{ marginBottom: '14px' }}>
            <div className="db-card-title-group">
              <h3>Grafik Tren Penjualan Waktu Nyata</h3>
              <p>
                {chartView === 'hourly'
                  ? 'Distribusi omzet per jam operasional booth (09:00 - 20:00)'
                  : 'Tren omzet harian sepanjang rentang tanggal terpilih'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setChartView('hourly')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: chartView === 'hourly' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                Hourly (Per Jam)
              </button>
              <button
                type="button"
                onClick={() => setChartView('daily')}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: chartView === 'daily' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                Daily (Per Hari)
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          {chartView === 'hourly' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '160px',
                gap: '8px',
                paddingTop: '20px',
                borderBottom: '1px solid var(--border-subtle)',
                overflowX: 'auto',
              }}
            >
              {hourlyData.map(pt => {
                const heightPct = Math.max(6, Math.round((pt.sales / maxHourlySales) * 100));
                const isPeak = pt.sales === maxHourlySales && pt.sales > 0;

                return (
                  <div
                    key={pt.hour}
                    style={{
                      flex: 1,
                      minWidth: '42px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: isPeak ? 'var(--cyan)' : 'var(--text-dim)',
                        fontWeight: isPeak ? 800 : 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pt.sales > 0 ? `${Math.round(pt.sales / 1000)}k` : '0'}
                    </span>

                    <div
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${heightPct}%`,
                        background: isPeak 
                          ? 'linear-gradient(180deg, var(--cyan) 0%, rgba(6, 182, 212, 0.2) 100%)' 
                          : pt.sales > 0 
                            ? 'linear-gradient(180deg, #6366f1 0%, rgba(99, 102, 241, 0.2) 100%)' 
                            : 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '4px 4px 0 0',
                        border: isPeak ? '1px solid var(--cyan)' : '1px solid rgba(99, 102, 241, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                      title={`${pt.hourLabel}: ${formatRupiah(pt.sales, true, false)} (${pt.transactionCount} nota)`}
                    ></div>

                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {pt.hourLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Daily Chart */
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: '160px',
                gap: '8px',
                paddingTop: '20px',
                borderBottom: '1px solid var(--border-subtle)',
                overflowX: 'auto',
              }}
            >
              {dailyData.map(pt => {
                const heightPct = Math.max(6, Math.round((pt.sales / maxDailySales) * 100));
                const isPeak = pt.sales === maxDailySales && pt.sales > 0;

                return (
                  <div
                    key={pt.date}
                    style={{
                      flex: 1,
                      minWidth: '55px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: isPeak ? 'var(--cyan)' : 'var(--text-dim)',
                        fontWeight: isPeak ? 800 : 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pt.sales > 0 ? `${Math.round(pt.sales / 1000)}k` : '0'}
                    </span>

                    <div
                      style={{
                        width: '100%',
                        maxWidth: '34px',
                        height: `${heightPct}%`,
                        background: isPeak 
                          ? 'linear-gradient(180deg, var(--cyan) 0%, rgba(6, 182, 212, 0.2) 100%)' 
                          : pt.sales > 0 
                            ? 'linear-gradient(180deg, var(--pink) 0%, rgba(236, 72, 153, 0.2) 100%)' 
                            : 'rgba(255, 255, 255, 0.04)',
                        borderRadius: '4px 4px 0 0',
                        border: isPeak ? '1px solid var(--cyan)' : '1px solid var(--border-pink)',
                        transition: 'all 0.2s ease',
                      }}
                      title={`${pt.dateLabel}: ${formatRupiah(pt.sales, true, false)} (${pt.transactionCount} nota)`}
                    ></div>

                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {pt.dateLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3-Column Insights Row: Top Products, Payment Distribution, Category Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {/* 1. Top 5 Products (BAGIAN 12) */}
          <div className="dashboard-card" style={{ padding: '16px' }}>
            <div className="db-card-header" style={{ marginBottom: '12px' }}>
              <div className="db-card-title-group">
                <h3>Top Merchandise Terlaris</h3>
                <p>Urutkan berdasarkan kuantitas atau omzet</p>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setTopProductSort('qty')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: topProductSort === 'qty' ? 'var(--pink)' : 'rgba(255, 255, 255, 0.05)',
                    color: topProductSort === 'qty' ? '#ffffff' : 'var(--text-dim)',
                    border: 'none',
                  }}
                >
                  By Qty
                </button>
                <button
                  type="button"
                  onClick={() => setTopProductSort('omzet')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: topProductSort === 'omzet' ? 'var(--pink)' : 'rgba(255, 255, 255, 0.05)',
                    color: topProductSort === 'omzet' ? '#ffffff' : 'var(--text-dim)',
                    border: 'none',
                  }}
                >
                  By Omzet
                </button>
                <Award size={16} color="var(--pink)" style={{ marginLeft: '4px' }} />
              </div>
            </div>

            {topProducts.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                Belum ada transaksi pada periode ini.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topProducts.map(p => (
                  <div
                    key={p.productId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          background: p.rank === 1 ? 'var(--pink-bg)' : 'rgba(255, 255, 255, 0.05)',
                          color: p.rank === 1 ? 'var(--pink)' : 'var(--text-secondary)',
                          fontSize: '10px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {p.rank}
                      </span>
                      {p.image && (
                        <img
                          src={p.image}
                          alt=""
                          style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                          {p.sku} • {p.quantitySold} pcs
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--cyan)' }}>
                        {formatRupiah(p.revenue, true, false)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                        @{formatRupiah(p.averagePrice, true, false)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Payment Distribution (BAGIAN 13) */}
          <div className="dashboard-card" style={{ padding: '16px' }}>
            <div className="db-card-header" style={{ marginBottom: '12px' }}>
              <div className="db-card-title-group">
                <h3>Distribusi Pembayaran</h3>
                <p>Volume arus kas kasir</p>
              </div>
              <CreditCard size={16} color="var(--cyan)" />
            </div>

            {/* Split Progress Bar */}
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', background: '#040810', marginBottom: '14px' }}>
              {paymentDist.map(item => (
                <div
                  key={item.method}
                  style={{
                    width: `${item.percentage}%`,
                    background: item.method === 'cash' ? '#38bdf8' : item.method === 'qris' ? '#ec4899' : '#818cf8',
                    transition: 'all 0.3s ease',
                  }}
                  title={`${item.label}: ${item.percentage}%`}
                ></div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paymentDist.map(item => (
                <div
                  key={item.method}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.method === 'cash' ? '#38bdf8' : item.method === 'qris' ? '#ec4899' : '#818cf8',
                        }}
                      ></span>
                      <span>{item.label}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '14px' }}>
                      {item.count} transaksi
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {formatRupiah(item.total, true, false)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--cyan)', fontWeight: 700 }}>
                      {item.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Category Sales (BAGIAN 14) */}
          <div className="dashboard-card" style={{ padding: '16px' }}>
            <div className="db-card-header" style={{ marginBottom: '12px' }}>
              <div className="db-card-title-group">
                <h3>Penjualan per Kategori</h3>
                <p>Komposisi omzet merchandise</p>
              </div>
              <Tag size={16} color="#a5b4fc" />
            </div>

            {categorySales.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                Belum ada data penjualan kategori.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categorySales.map(c => (
                  <div key={c.categoryId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{c.categoryName}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--cyan)' }}>
                        {formatRupiah(c.revenue, true, false)} ({c.percentage}%)
                      </span>
                    </div>

                    <div style={{ height: '6px', background: '#040810', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${c.percentage}%`,
                          background: 'linear-gradient(90deg, #6366f1, var(--cyan))',
                          borderRadius: '3px',
                        }}
                      ></div>
                    </div>

                    <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {c.itemsSold} pcs terjual
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section: Discount Analysis (BAGIAN 16) */}
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.05)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f43f5e',
              }}
            >
              <Percent size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                Analisis Diskon & Promo Event
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                Total diskon tersalurkan: <strong style={{ color: '#f43f5e' }}>{formatRupiah(summary.totalDiscount, true, false)}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Nota dengan Diskon:</span>
              <div style={{ fontWeight: 800, color: '#ffffff' }}>{summary.discountedTransactionsCount} nota</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)' }}>Rata-rata Diskon:</span>
              <div style={{ fontWeight: 800, color: '#ffffff' }}>{formatRupiah(summary.averageDiscount, true, false)}</div>
            </div>
          </div>
        </div>

        {/* Section: Product Performance Table (BAGIAN 15) */}
        <div className="dashboard-card" style={{ padding: '16px 20px' }}>
          <div className="db-card-header" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div className="db-card-title-group">
              <h3>Performa Penjualan Seluruh Merchandise</h3>
              <p>Metrik omzet, unit terjual, harga rata-rata, dan status stok terkini</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={13} color="var(--text-dim)" />
              <select
                value={perfSort}
                onChange={e => setPerfSort(e.target.value as PerformanceSort)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 10px',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                }}
              >
                <option value="sales-desc">Omzet Tertinggi</option>
                <option value="qty-desc">Unit Terbanyak</option>
                <option value="stock-asc">Stok Tersedikit</option>
                <option value="name-asc">Nama A - Z</option>
              </select>
            </div>
          </div>

          <div
            className="data-table-wrapper"
            style={{
              overflowY: 'auto',
              maxHeight: '340px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <table className="cosplay-table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th>Merchandise</th>
                  <th style={{ width: '90px' }}>SKU</th>
                  <th style={{ width: '110px' }}>Kategori</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Unit Terjual</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>Total Omzet</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Harga Rata-rata</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Stok Fisik</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Status Stok</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '12px' }}>
                        {item.name}
                      </span>
                    </td>
                    <td>
                      <span className="inv-code" style={{ fontSize: '11px' }}>{item.sku}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.categoryName}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: item.unitsSold > 0 ? 'var(--cyan)' : 'var(--text-dim)' }}>
                        {item.unitsSold} pcs
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                        {formatRupiah(item.revenue, true, false)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-dim)' }}>
                      {formatRupiah(item.averagePrice, true, false)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: item.currentStock === 0 ? '#f43f5e' : item.currentStock <= item.minimumStock ? '#fbbf24' : '#ffffff',
                        }}
                      >
                        {item.currentStock} pcs
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: item.stockStatus === 'READY' ? 'rgba(16, 185, 129, 0.15)' : item.stockStatus === 'LOW STOCK' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: item.stockStatus === 'READY' ? '#34d399' : item.stockStatus === 'LOW STOCK' ? '#fbbf24' : '#f87171',
                          border: `1px solid ${item.stockStatus === 'READY' ? 'rgba(16, 185, 129, 0.3)' : item.stockStatus === 'LOW STOCK' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.stockStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
