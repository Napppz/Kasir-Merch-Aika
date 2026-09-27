import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Receipt, 
  ShoppingBag, 
  AlertTriangle, 
  Plus, 
  Package, 
  Boxes, 
  TrendingUp 
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { formatRupiah } from '../utils/formatters';
import { MetricCard } from '../components/dashboard/MetricCard';
import { HourlyTrafficChart } from '../components/dashboard/HourlyTrafficChart';
import { PaymentDistributionCard } from '../components/dashboard/PaymentDistributionCard';
import { TopProductsCard } from '../components/dashboard/TopProductsCard';
import { CriticalStockCard } from '../components/dashboard/CriticalStockCard';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { resolveDateRange, isDateInRange, getSalesSummary } from '../services/reportService';

export const DashboardPage: React.FC = () => {
  const { transactions, products, setCurrentPage } = usePos();
  const [activePeriod, setActivePeriod] = useState<'today' | 'yesterday' | 'total'>('today');

  // Filter transactions by selected period
  const periodTransactions = useMemo(() => {
    if (activePeriod === 'total') return transactions;
    const range = resolveDateRange(activePeriod);
    return transactions.filter(t => isDateInRange(t.transactionDate, range));
  }, [transactions, activePeriod]);

  // Compute live metrics from IndexedDB transactions (BAGIAN 22)
  const summary = useMemo(() => {
    return getSalesSummary(periodTransactions);
  }, [periodTransactions]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock <= p.minimumStock).length;
  }, [products]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <div className="page-subheader">
        <div className="subheader-title-group">
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--pink)', letterSpacing: '0.8px' }}>
            TERMINAL LAPORAN V2.4 • BOOTH LIVE
          </div>
          <h2>Dashboard Penjualan Booth</h2>
          <div className="subheader-subtitle">
            Ringkasan performa penjualan merchandise dari database lokal IndexedDB
          </div>
        </div>

        {/* Filter Pills & Quick Actions */}
        <div className="dashboard-subheader-controls">
          {/* Period Tabs */}
          <div className="dashboard-period-tabs">
            <button
              type="button"
              className={`period-tab-btn ${activePeriod === 'today' ? 'active' : ''}`}
              onClick={() => setActivePeriod('today')}
            >
              Hari Ini
            </button>
            <button
              type="button"
              className={`period-tab-btn ${activePeriod === 'yesterday' ? 'active' : ''}`}
              onClick={() => setActivePeriod('yesterday')}
            >
              Kemarin
            </button>
            <button
              type="button"
              className={`period-tab-btn ${activePeriod === 'total' ? 'active' : ''}`}
              onClick={() => setActivePeriod('total')}
            >
              Semua Periode
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="dashboard-quick-actions">
            <button
              type="button"
              className="dashboard-action-btn primary"
              onClick={() => setCurrentPage('pos')}
            >
              <Plus size={14} />
              <span>Transaksi Baru</span>
            </button>

            <button
              type="button"
              className="dashboard-action-btn"
              onClick={() => setCurrentPage('products')}
            >
              <Package size={14} />
              <span>Produk</span>
            </button>

            <button
              type="button"
              className="dashboard-action-btn"
              onClick={() => setCurrentPage('inventory')}
            >
              <Boxes size={14} />
              <span>Inventaris</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Scrollable Body */}
      <div className="dashboard-view-container">
        {/* Top 4 KPI Metrics (Computed from IndexedDB - BAGIAN 22) */}
        <div className="metrics-grid-4">
          {/* 1. Omzet Net Sales */}
          <MetricCard
            title={activePeriod === 'today' ? 'OMZET HARI INI' : activePeriod === 'yesterday' ? 'OMZET KEMARIN' : 'TOTAL OMZET BERSIH'}
            value={formatRupiah(summary.netSales, true, true)}
            icon={<CreditCard size={18} />}
            iconColor="purple"
            footer={
              <div className="metric-footer positive">
                <TrendingUp size={13} />
                <span>Gross: {formatRupiah(summary.grossSales, true, false)}</span>
              </div>
            }
          />

          {/* 2. Total Transaksi */}
          <MetricCard
            title="TOTAL TRANSAKSI"
            value={`${summary.totalTransactions} Transaksi`}
            icon={<Receipt size={18} />}
            iconColor="pink"
            footer={
              <div className="metric-footer">
                <span>📄 Rata-rata: {formatRupiah(summary.averageTransaction, true, false)} /nota</span>
              </div>
            }
          />

          {/* 3. Merchandise Terjual */}
          <MetricCard
            title="MERCHANDISE TERJUAL"
            value={`${summary.totalItemsSold} Pcs`}
            icon={<ShoppingBag size={18} />}
            iconColor="cyan"
            footer={
              <div className="metric-footer">
                <span>⭐ {summary.discountedTransactionsCount} nota dengan diskon</span>
              </div>
            }
          />

          {/* 4. Peringatan Stok */}
          <MetricCard
            title="PERINGATAN STOK"
            badge={lowStockCount > 0 ? 'Perlu Restock' : 'Stok Aman'}
            value={`${lowStockCount} Produk Menipis`}
            icon={<AlertTriangle size={18} />}
            iconColor={lowStockCount > 0 ? 'red' : 'cyan'}
            isWarning={lowStockCount > 0}
            footer={
              <div className={`metric-footer ${lowStockCount > 0 ? 'warning' : 'positive'}`}>
                <span>{lowStockCount > 0 ? '📦 Ambil dari kardus cadangan bawah meja' : 'Semua stok di atas batas minimum'}</span>
              </div>
            }
          />
        </div>

        {/* 2-Column Middle Grid */}
        <div className="dashboard-middle-grid">
          {/* Left Column: Hourly Traffic + Payment Split */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <HourlyTrafficChart />
            <PaymentDistributionCard />
          </div>

          {/* Right Column: Top Products + Critical Stock */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TopProductsCard />
            <CriticalStockCard />
          </div>
        </div>

        {/* Bottom Full-Width Table: Recent Transactions Live Feed */}
        <RecentTransactionsTable />
      </div>
    </div>
  );
};
