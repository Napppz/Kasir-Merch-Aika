import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  PackagePlus, 
  SlidersHorizontal, 
  ClipboardCheck, 
  Search, 
  ArrowDownRight, 
  ArrowUpRight, 
  History
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import { StockInModal } from '../components/inventory/StockInModal';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { StockOpnameModal } from '../components/inventory/StockOpnameModal';
import { StockHistoryTable } from '../components/inventory/StockHistoryTable';
import { MovementDetailDrawer } from '../components/inventory/MovementDetailDrawer';
import type { StockMovement } from '../types';
import { formatDateTime } from '../utils/formatters';

type TabType = 'stock' | 'history' | 'opname';
type SortOption = 'stock-asc' | 'stock-desc' | 'name-asc' | 'last-movement';
type StatusFilter = 'ALL' | 'READY' | 'LOW' | 'OUT';

export const InventoryPage: React.FC = () => {
  const { 
    products, 
    categories, 
    stockMovements, 
    opnameSessions,
  } = usePos();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<TabType>('stock');

  // Modals & Drawer State
  const [isStockInOpen, setIsStockInOpen] = useState<boolean>(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState<boolean>(false);
  const [isOpnameOpen, setIsOpnameOpen] = useState<boolean>(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  // Filters & Sorting for Merchandise Stock Table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('stock-asc');

  // Today Date String for Today's Stats
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute 7 KPI Metrics (BAGIAN 3)
  const stats = useMemo(() => {
    const totalItemTypes = products.length;
    const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minimumStock).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    // Today's Movements
    const todayMovements = stockMovements.filter(m => m.createdAt.startsWith(todayStr));
    const todayMovementCount = todayMovements.length;

    // Today Stock In
    const todayStockInUnits = todayMovements
      .filter(m => ['INITIAL', 'STOCK_IN', 'ADJUSTMENT_IN', 'OPNAME_IN'].includes(m.type))
      .reduce((acc, m) => acc + m.quantity, 0);

    // Today Stock Out
    const todayStockOutUnits = todayMovements
      .filter(m => ['SALE', 'ADJUSTMENT_OUT', 'DAMAGE', 'LOST', 'OPNAME_OUT'].includes(m.type))
      .reduce((acc, m) => acc + m.quantity, 0);

    return {
      totalItemTypes,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      todayMovementCount,
      todayStockInUnits,
      todayStockOutUnits,
    };
  }, [products, stockMovements, todayStr]);

  // Last movement lookup per product
  const lastMovementsMap = useMemo(() => {
    const map = new Map<string, StockMovement>();
    for (const m of stockMovements) {
      if (!map.has(m.productId)) {
        map.set(m.productId, m);
      }
    }
    return map;
  }, [stockMovements]);

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Search filter (Product Name & SKU)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          if (!matchName && !matchSku) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) {
          return false;
        }

        // Stock status filter (Based on Product.minimumStock)
        if (statusFilter === 'OUT' && p.stock !== 0) return false;
        if (statusFilter === 'LOW' && (p.stock === 0 || p.stock > p.minimumStock)) return false;
        if (statusFilter === 'READY' && p.stock <= p.minimumStock) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'last-movement') {
          const moveA = lastMovementsMap.get(a.id)?.createdAt || '';
          const moveB = lastMovementsMap.get(b.id)?.createdAt || '';
          return moveB.localeCompare(moveA);
        }
        return 0;
      });
  }, [products, searchQuery, selectedCategory, statusFilter, sortBy, lastMovementsMap]);

  const handleOpenStockIn = (productId?: string) => {
    setSelectedProductId(productId);
    setIsStockInOpen(true);
  };

  const handleOpenAdjustment = (productId?: string) => {
    setSelectedProductId(productId);
    setIsAdjustmentOpen(true);
  };

  const handleViewProductHistory = (productId: string) => {
    setSelectedProductId(productId);
    setActiveTab('history');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Subheader */}
      <div className="page-subheader">
        <div className="subheader-title-group">
          <h2>
            <Boxes size={20} color="var(--cyan)" />
            <span>Manajemen Stok & Stock Opname</span>
          </h2>
          <div className="subheader-subtitle">
            Dashboard inventaris merchandise booth, pergerakan stok real-time, dan audit fisik
          </div>
        </div>

        {/* Global Action CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleOpenStockIn()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid var(--cyan)',
              color: 'var(--cyan)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <PackagePlus size={15} />
            <span>+ Stock In</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdjustment()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.5)',
              color: '#f43f5e',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={15} />
            <span>± Penyesuaian</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpnameOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              background: 'var(--primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 15px var(--primary-glow)',
            }}
          >
            <ClipboardCheck size={16} />
            <span>📋 Stock Opname Baru</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Body */}
      <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top 7 KPI Cards (BAGIAN 3) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {/* 1. Total Jenis Produk */}
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
              JENIS MERCHANDISE
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {stats.totalItemTypes}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Produk terdaftar</div>
          </div>

          {/* 2. Total Unit Stok */}
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
              TOTAL UNIT STOK
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              {stats.totalUnits} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>pcs</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Tersedia di booth</div>
          </div>

          {/* 3. Produk Stok Rendah */}
          <div
            style={{
              background: stats.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-card)',
              border: `1px solid ${stats.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.35)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: stats.lowStockCount > 0 ? '#fbbf24' : 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
              STOK MENIPIS
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: stats.lowStockCount > 0 ? '#fbbf24' : '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {stats.lowStockCount} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>SKU</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>≤ batas minimum</div>
          </div>

          {/* 4. Produk Habis */}
          <div
            style={{
              background: stats.outOfStockCount > 0 ? 'rgba(244, 63, 94, 0.08)' : 'var(--bg-card)',
              border: `1px solid ${stats.outOfStockCount > 0 ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '10px', color: stats.outOfStockCount > 0 ? '#f43f5e' : 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.5px' }}>
              STOK HABIS (0)
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: stats.outOfStockCount > 0 ? '#f43f5e' : '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {stats.outOfStockCount} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>SKU</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Perlu restock segera</div>
          </div>

          {/* 5. Movement Hari Ini */}
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
              MOVEMENT HARI INI
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>
              {stats.todayMovementCount}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Aktivitas log</div>
          </div>

          {/* 6. Stock Masuk Hari Ini */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--cyan)', fontWeight: 700 }}>
              <ArrowDownRight size={12} />
              <span>MASUK HARI INI</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              +{stats.todayStockInUnits} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>pcs</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Restock & in</div>
          </div>

          {/* 7. Stock Keluar Hari Ini */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#f43f5e', fontWeight: 700 }}>
              <ArrowUpRight size={12} />
              <span>KELUAR HARI INI</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
              -{stats.todayStockOutUnits} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>pcs</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Terjual & adjust</div>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('stock');
                setSelectedProductId(undefined);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'stock' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeTab === 'stock' ? '#ffffff' : 'var(--text-dim)',
                border: `1px solid ${activeTab === 'stock' ? 'var(--primary)' : 'transparent'}`,
              }}
            >
              <Boxes size={15} color={activeTab === 'stock' ? 'var(--cyan)' : 'currentColor'} />
              <span>Stok Merchandise ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'history' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeTab === 'history' ? '#ffffff' : 'var(--text-dim)',
                border: `1px solid ${activeTab === 'history' ? 'var(--primary)' : 'transparent'}`,
              }}
            >
              <History size={15} color={activeTab === 'history' ? 'var(--cyan)' : 'currentColor'} />
              <span>Riwayat Pergerakan Stok ({stockMovements.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('opname');
                setSelectedProductId(undefined);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: activeTab === 'opname' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeTab === 'opname' ? '#ffffff' : 'var(--text-dim)',
                border: `1px solid ${activeTab === 'opname' ? 'var(--primary)' : 'transparent'}`,
              }}
            >
              <ClipboardCheck size={15} color={activeTab === 'opname' ? 'var(--cyan)' : 'currentColor'} />
              <span>Sesi Stock Opname ({opnameSessions.length})</span>
            </button>
          </div>

          {activeTab === 'history' && selectedProductId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--cyan)' }}>
                Filter produk aktif: <strong>{products.find(p => p.id === selectedProductId)?.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedProductId(undefined)}
                style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-muted)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Hapus Filter Produk
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Stok Merchandise (Inventory Table with Search & Multi-filters) */}
        {activeTab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
            {/* Filter Toolbar (BAGIAN 5) */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search by Name / SKU */}
              <div
                style={{
                  flex: 1,
                  minWidth: '220px',
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
                  placeholder="Cari nama merchandise atau SKU..."
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

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                }}
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter (Ready, Low, Out) */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { id: 'ALL', label: 'Semua Status' },
                  { id: 'READY', label: 'Ready' },
                  { id: 'LOW', label: 'Low Stock' },
                  { id: 'OUT', label: 'Out of Stock' },
                ].map(s => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setStatusFilter(s.id as StatusFilter)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: statusFilter === s.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: statusFilter === s.id ? '#a5b4fc' : 'var(--text-secondary)',
                      border: `1px solid ${statusFilter === s.id ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Sorting Filter */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-muted)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                }}
              >
                <option value="stock-asc">Stok: Terendah ke Tertinggi</option>
                <option value="stock-desc">Stok: Tertinggi ke Terendah</option>
                <option value="name-asc">Nama: A - Z</option>
                <option value="last-movement">Pergerakan Terakhir</option>
              </select>
            </div>

            {/* Inventory Table (BAGIAN 4) */}
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
              <table className="cosplay-table" style={{ width: '100%' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                    <th>Merchandise</th>
                    <th style={{ width: '100px' }}>SKU</th>
                    <th style={{ width: '130px' }}>Kategori</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Stok Saat Ini</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Batas Minimum</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Status Stok</th>
                    <th style={{ width: '160px' }}>Pergerakan Terakhir</th>
                    <th style={{ width: '180px', textAlign: 'center' }}>Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => {
                    const category = categories.find(c => c.id === p.categoryId);
                    const lastMove = lastMovementsMap.get(p.id);

                    // Dynamic threshold from Product.minimumStock (BAGIAN 16)
                    let statusBadge = {
                      label: 'READY',
                      bg: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: 'rgba(16, 185, 129, 0.3)',
                    };
                    if (p.stock === 0) {
                      statusBadge = {
                        label: 'OUT OF STOCK',
                        bg: 'rgba(239, 68, 68, 0.15)',
                        color: '#f87171',
                        border: 'rgba(239, 68, 68, 0.3)',
                      };
                    } else if (p.stock <= p.minimumStock) {
                      statusBadge = {
                        label: 'LOW STOCK',
                        bg: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        border: 'rgba(245, 158, 11, 0.3)',
                      };
                    }

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {p.image && (
                              <img
                                src={p.image}
                                alt=""
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  background: '#040810',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px' }}>
                                {p.name}
                              </div>
                              {p.locationNote && (
                                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                                  Lokasi: {p.locationNote}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="inv-code" style={{ fontSize: '11px' }}>{p.sku}</span>
                        </td>

                        <td>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {category?.name || '-'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '15px',
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              color: p.stock === 0 ? '#f43f5e' : p.stock <= p.minimumStock ? '#fbbf24' : '#ffffff',
                            }}
                          >
                            {p.stock}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginLeft: '3px' }}>pcs</span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                            {p.minimumStock} pcs
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: statusBadge.bg,
                              color: statusBadge.color,
                              border: `1px solid ${statusBadge.border}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {statusBadge.label}
                          </span>
                        </td>

                        <td>
                          {lastMove ? (
                            <div
                              onClick={() => setSelectedMovement(lastMove)}
                              style={{ cursor: 'pointer' }}
                              title="Klik untuk lihat detail pergerakan"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--cyan)' }}>
                                  {lastMove.type}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                                  ({lastMove.stockBefore}→{lastMove.stockAfter})
                                </span>
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                                {formatDateTime(lastMove.createdAt)}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Belum ada log</span>
                          )}
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenStockIn(p.id)}
                              title="Tambah stok masuk"
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(6, 182, 212, 0.1)',
                                border: '1px solid rgba(6, 182, 212, 0.4)',
                                borderRadius: '4px',
                                color: 'var(--cyan)',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              + In
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenAdjustment(p.id)}
                              title="Penyesuaian stok"
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(244, 63, 94, 0.1)',
                                border: '1px solid rgba(244, 63, 94, 0.4)',
                                borderRadius: '4px',
                                color: '#f43f5e',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ± Adjust
                            </button>

                            <button
                              type="button"
                              onClick={() => handleViewProductHistory(p.id)}
                              title="Lihat riwayat pergerakan produk ini"
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Histori
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Riwayat Pergerakan Stok (Audit Trail & Filterable) */}
        {activeTab === 'history' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <StockHistoryTable
              movements={stockMovements}
              products={products}
              filterProductId={selectedProductId}
              onSelectMovement={m => setSelectedMovement(m)}
            />
          </div>
        )}

        {/* Tab 3: Sesi Stock Opname (BAGIAN 9) */}
        {activeTab === 'opname' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Daftar histori sesi stock opname fisik di booth convention.
              </div>
              <button
                type="button"
                onClick={() => setIsOpnameOpen(true)}
                style={{
                  padding: '7px 14px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px var(--primary-glow)',
                }}
              >
                <ClipboardCheck size={15} />
                <span>+ Stock Opname Baru</span>
              </button>
            </div>

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
              {opnameSessions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  Belum ada sesi stock opname yang tercatat.
                </div>
              ) : (
                <table className="cosplay-table" style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                      <th>No. Sesi Opname</th>
                      <th>Waktu Selesai</th>
                      <th style={{ textAlign: 'center' }}>Total Item Dihitung</th>
                      <th style={{ textAlign: 'center' }}>Total Selisih Unit</th>
                      <th style={{ textAlign: 'center' }}>Status Sesi</th>
                      <th>Catatan Sesi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opnameSessions.map(session => (
                      <tr key={session.id}>
                        <td>
                          <span
                            className="inv-code"
                            style={{
                              fontSize: '11px',
                              color: 'var(--cyan)',
                              background: 'var(--cyan-bg)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {session.opnameNumber}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {session.completedAt ? formatDateTime(session.completedAt) : formatDateTime(session.startedAt)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                            {session.totalItems} jenis
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 900,
                              fontFamily: 'var(--font-mono)',
                              color: session.totalDifference === 0 ? '#34d399' : session.totalDifference > 0 ? 'var(--cyan)' : '#f43f5e',
                            }}
                          >
                            {session.totalDifference === 0 ? '0 (Cocok)' : session.totalDifference > 0 ? `+${session.totalDifference}` : session.totalDifference} pcs
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {session.note || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals & Detail Drawers */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        preselectedProductId={selectedProductId}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        preselectedProductId={selectedProductId}
      />

      <StockOpnameModal
        isOpen={isOpnameOpen}
        onClose={() => setIsOpnameOpen(false)}
      />

      <MovementDetailDrawer
        movement={selectedMovement}
        product={selectedMovement ? products.find(p => p.id === selectedMovement.productId) : undefined}
        onClose={() => setSelectedMovement(null)}
      />
    </div>
  );
};
