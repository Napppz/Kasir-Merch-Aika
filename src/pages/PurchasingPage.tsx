import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  ShoppingCart, 
  Building2, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Ban, 
  Send, 
  Edit3, 
  Trash2
} from 'lucide-react';
import { usePos } from '../context/PosContext';
import type { PurchaseOrder, Supplier, ReceivingRecord, PurchaseOrderStatus } from '../types';
import { 
  formatRupiah, 
  formatPurchasingDate, 
  exportPurchaseOrdersCSV, 
  exportReceivingCSV 
} from '../services/purchasingService';
import { SupplierModal } from '../components/purchasing/SupplierModal';
import { CreatePoModal } from '../components/purchasing/CreatePoModal';
import { PoDetailModal } from '../components/purchasing/PoDetailModal';
import { ReceiveGoodsModal } from '../components/purchasing/ReceiveGoodsModal';
import { ReceivingDetailModal } from '../components/purchasing/ReceivingDetailModal';

type PurchasingTab = 'orders' | 'suppliers' | 'receiving';
type DatePreset = 'all' | 'today' | 'yesterday' | '7days' | '30days' | 'this_month';

export const PurchasingPage: React.FC = () => {
  const { 
    suppliers, 
    purchaseOrders, 
    receivingRecords, 
    products, 
    settings,
    addSupplier,
    updateSupplier,
    toggleSupplierStatus,
    deleteSupplier,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    cancelPurchaseOrder,
    executeReceiving,
  } = usePos();

  // Active Tab
  const [activeTab, setActiveTab] = useState<PurchasingTab>('orders');

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [isCreatePoModalOpen, setIsCreatePoModalOpen] = useState(false);

  const [selectedPoForDetail, setSelectedPoForDetail] = useState<PurchaseOrder | null>(null);
  const [isPoDetailOpen, setIsPoDetailOpen] = useState(false);

  const [selectedPoForReceive, setSelectedPoForReceive] = useState<PurchaseOrder | null>(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  const [selectedReceivingRecord, setSelectedReceivingRecord] = useState<ReceivingRecord | null>(null);
  const [isReceivingDetailOpen, setIsReceivingDetailOpen] = useState(false);

  // Filters for Purchase Orders
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState<string>('ALL');
  const [poSupplierFilter, setPoSupplierFilter] = useState<string>('ALL');
  const [poDatePreset, setPoDatePreset] = useState<DatePreset>('all');

  // Filters for Suppliers
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatusFilter, setSupplierStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filters for Receiving Records
  const [receivingSearch, setReceivingSearch] = useState('');

  // Date filtering helper
  const filterByDatePreset = (dateIso: string, preset: DatePreset): boolean => {
    if (preset === 'all') return true;
    const itemDate = new Date(dateIso);
    const now = new Date();
    
    // Normalize to date-only comparisons
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    if (preset === 'today') {
      return itemDay.getTime() === startOfToday.getTime();
    }
    if (preset === 'yesterday') {
      const yesterday = new Date(startOfToday);
      yesterday.setDate(yesterday.getDate() - 1);
      return itemDay.getTime() === yesterday.getTime();
    }
    if (preset === '7days') {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return itemDay >= sevenDaysAgo;
    }
    if (preset === '30days') {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return itemDay >= thirtyDaysAgo;
    }
    if (preset === 'this_month') {
      return itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth();
    }
    return true;
  };

  // Filtered Purchase Orders
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      // Status filter
      if (poStatusFilter !== 'ALL' && po.status !== poStatusFilter) return false;

      // Supplier filter
      if (poSupplierFilter !== 'ALL' && po.supplierId !== poSupplierFilter) return false;

      // Date preset filter
      if (!filterByDatePreset(po.orderDate, poDatePreset)) return false;

      // Search term
      if (poSearch.trim()) {
        const q = poSearch.toLowerCase();
        const poNum = po.poNumber.toLowerCase();
        const supName = po.supplierNameSnapshot.toLowerCase();
        const notes = (po.notes || '').toLowerCase();
        const hasItemMatch = po.items?.some(
          i => i.productNameSnapshot.toLowerCase().includes(q) || i.skuSnapshot.toLowerCase().includes(q)
        );

        return poNum.includes(q) || supName.includes(q) || notes.includes(q) || hasItemMatch;
      }

      return true;
    });
  }, [purchaseOrders, poStatusFilter, poSupplierFilter, poDatePreset, poSearch]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      if (supplierStatusFilter !== 'ALL' && s.status !== supplierStatusFilter) return false;

      if (supplierSearch.trim()) {
        const q = supplierSearch.toLowerCase();
        const name = s.name.toLowerCase();
        const pic = (s.contactPerson || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        const email = (s.email || '').toLowerCase();

        return name.includes(q) || pic.includes(q) || phone.includes(q) || email.includes(q);
      }

      return true;
    });
  }, [suppliers, supplierStatusFilter, supplierSearch]);

  // Filtered Receiving Records
  const filteredReceivingRecords = useMemo(() => {
    return receivingRecords.filter(r => {
      if (receivingSearch.trim()) {
        const q = receivingSearch.toLowerCase();
        const rcvNum = r.receivingNumber.toLowerCase();
        const poNum = r.poNumber.toLowerCase();
        const supName = r.supplierName.toLowerCase();
        const by = r.receivedBy.toLowerCase();
        const hasItemMatch = r.items?.some(
          i => i.productNameSnapshot.toLowerCase().includes(q) || i.skuSnapshot.toLowerCase().includes(q)
        );

        return rcvNum.includes(q) || poNum.includes(q) || supName.includes(q) || by.includes(q) || hasItemMatch;
      }
      return true;
    });
  }, [receivingRecords, receivingSearch]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const totalPos = purchaseOrders.length;
    const draftCount = purchaseOrders.filter(p => p.status === 'DRAFT').length;
    const orderedCount = purchaseOrders.filter(p => p.status === 'ORDERED').length;
    const partialCount = purchaseOrders.filter(p => p.status === 'PARTIALLY_RECEIVED').length;
    const receivedCount = purchaseOrders.filter(p => p.status === 'RECEIVED').length;
    const cancelledCount = purchaseOrders.filter(p => p.status === 'CANCELLED').length;
    const totalPurchaseValue = purchaseOrders
      .filter(p => p.status !== 'CANCELLED')
      .reduce((sum, p) => sum + p.total, 0);

    return {
      totalPos,
      draftCount,
      orderedCount,
      partialCount,
      receivedCount,
      cancelledCount,
      totalPurchaseValue,
    };
  }, [purchaseOrders]);

  // Status Badge Helper
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return { label: 'DRAFT', bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
      case 'ORDERED':
        return { label: 'ORDERED', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'PARTIALLY_RECEIVED':
        return { label: 'PARTIAL', bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: 'rgba(234, 179, 8, 0.3)' };
      case 'RECEIVED':
        return { label: 'RECEIVED', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { label: status, bg: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', border: 'rgba(255, 255, 255, 0.2)' };
    }
  };

  // CSV Export Handlers
  const handleExportPoCSV = () => {
    exportPurchaseOrdersCSV(filteredPurchaseOrders, poDatePreset);
  };

  const handleExportReceivingCSV = () => {
    exportReceivingCSV(filteredReceivingRecords, 'semua');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--text-bright)' }}>
              Purchasing & Receiving
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#ec4899',
                border: '1px solid rgba(236, 72, 153, 0.3)',
              }}
            >
              TAHAP 6
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
            Kelola pengadaan merchandise, purchase order, dan receiving otomatis ke stok inventori
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={activeTab === 'receiving' ? handleExportReceivingCSV : handleExportPoCSV}
            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>{activeTab === 'receiving' ? 'Export CSV Receiving' : 'Export CSV PO'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSupplierToEdit(null);
              setIsSupplierModalOpen(true);
            }}
            style={{
              padding: '8px 14px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Building2 size={15} />
            <span>+ Supplier</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCreatePoModalOpen(true)}
            style={{
              boxShadow: '0 0 15px var(--primary-glow)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShoppingCart size={15} />
            <span>+ Buat Purchase Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Bar (Only on orders tab or overview) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Total PO</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-bright)' }} className="font-mono">
            {kpiData.totalPos}
          </div>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Draft</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#94a3b8' }} className="font-mono">
            {kpiData.draftCount}
          </div>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Ordered</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#60a5fa' }} className="font-mono">
            {kpiData.orderedCount}
          </div>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Partially Received</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#eab308' }} className="font-mono">
            {kpiData.partialCount}
          </div>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Received (Selesai)</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }} className="font-mono">
            {kpiData.receivedCount}
          </div>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-muted)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Total Nilai Pengadaan</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cyan)' }} className="font-mono">
            {formatRupiah(kpiData.totalPurchaseValue)}
          </div>
        </div>
      </div>

      {/* Main Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-muted)', gap: '4px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'orders' ? 'var(--text-bright)' : 'var(--text-dim)',
            fontWeight: activeTab === 'orders' ? 700 : 500,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <ShoppingCart size={16} color={activeTab === 'orders' ? 'var(--primary)' : 'currentColor'} />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'suppliers' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'suppliers' ? 'var(--text-bright)' : 'var(--text-dim)',
            fontWeight: activeTab === 'suppliers' ? 700 : 500,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <Building2 size={16} color={activeTab === 'suppliers' ? 'var(--primary)' : 'currentColor'} />
          <span>Suppliers ({suppliers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receiving')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'receiving' ? '2px solid var(--cyan)' : '2px solid transparent',
            color: activeTab === 'receiving' ? 'var(--text-bright)' : 'var(--text-dim)',
            fontWeight: activeTab === 'receiving' ? 700 : 500,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <Truck size={16} color={activeTab === 'receiving' ? 'var(--cyan)' : 'currentColor'} />
          <span>Riwayat Penerimaan (Receiving) ({receivingRecords.length})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px', overflow: 'hidden' }}>
          {/* Toolbar: Search, Status Filter, Supplier Filter, Date Preset */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                value={poSearch}
                onChange={e => setPoSearch(e.target.value)}
                placeholder="Cari No. PO, Supplier, produk..."
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>

            {/* Status Select */}
            <select
              className="input-field"
              value={poStatusFilter}
              onChange={e => setPoStatusFilter(e.target.value)}
              style={{ width: '150px', padding: '6px 8px', fontSize: '12px' }}
            >
              <option value="ALL">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ORDERED">ORDERED</option>
              <option value="PARTIALLY_RECEIVED">PARTIAL</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>

            {/* Supplier Select */}
            <select
              className="input-field"
              value={poSupplierFilter}
              onChange={e => setPoSupplierFilter(e.target.value)}
              style={{ width: '180px', padding: '6px 8px', fontSize: '12px' }}
            >
              <option value="ALL">Semua Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Date Preset */}
            <select
              className="input-field"
              value={poDatePreset}
              onChange={e => setPoDatePreset(e.target.value as DatePreset)}
              style={{ width: '140px', padding: '6px 8px', fontSize: '12px' }}
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
              <option value="this_month">Bulan Ini</option>
            </select>
          </div>

          {/* PO Table */}
          <div className="data-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>PO Number</th>
                  <th style={{ width: '140px' }}>Tanggal Order</th>
                  <th>Supplier</th>
                  <th style={{ width: '180px' }}>Item & Progres</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Total (Rp)</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '180px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                      Tidak ada Purchase Order yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredPurchaseOrders.map(po => {
                    const badge = getStatusBadge(po.status);
                    const items = po.items || [];
                    const ordered = items.reduce((sum, i) => sum + i.qtyOrdered, 0);
                    const received = items.reduce((sum, i) => sum + i.qtyReceived, 0);
                    const percent = Math.round((received / (ordered || 1)) * 100);

                    return (
                      <tr key={po.id}>
                        {/* PO Number */}
                        <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text-bright)' }}>
                          {po.poNumber}
                        </td>

                        {/* Order Date */}
                        <td style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          {formatPurchasingDate(po.orderDate)}
                        </td>

                        {/* Supplier */}
                        <td style={{ fontWeight: 600 }}>
                          {po.supplierNameSnapshot}
                        </td>

                        {/* Items count & progress */}
                        <td>
                          <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span>{items.length} produk</span>
                            <span className="font-mono">{received}/{ordered} pcs</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${percent}%`,
                                height: '100%',
                                background: percent >= 100 ? '#10b981' : percent > 0 ? '#eab308' : '#64748b',
                              }}
                            />
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--cyan)' }} className="font-mono">
                          {formatRupiah(po.total)}
                        </td>

                        {/* Status Badge */}
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              display: 'inline-block',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            {/* View Detail */}
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => {
                                setSelectedPoForDetail(po);
                                setIsPoDetailOpen(true);
                              }}
                              title="Lihat Detail PO"
                              style={{ padding: '5px' }}
                            >
                              <Eye size={15} />
                            </button>

                            {/* Receive Goods Button (if ORDERED or PARTIAL) */}
                            {(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPoForReceive(po);
                                  setIsReceiveModalOpen(true);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(6, 182, 212, 0.15)',
                                  color: 'var(--cyan)',
                                  border: '1px solid var(--border-cyan)',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Terima Barang Masuk"
                              >
                                <Truck size={13} />
                                <span>Receive</span>
                              </button>
                            )}

                            {/* Kirim Order (if DRAFT) */}
                            {po.status === 'DRAFT' && (
                              <button
                                type="button"
                                onClick={() => updatePurchaseOrderStatus(po.id, 'ORDERED')}
                                style={{
                                  padding: '4px 8px',
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#60a5fa',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                                title="Kirim ke Supplier (Ubah status ke ORDERED)"
                              >
                                <Send size={13} />
                                <span>Order</span>
                              </button>
                            )}

                            {/* Cancel Button (if DRAFT or ORDERED) */}
                            {(po.status === 'DRAFT' || po.status === 'ORDERED') && (
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => {
                                  if (confirm(`Batalkan Purchase Order ${po.poNumber}?`)) {
                                    cancelPurchaseOrder(po.id);
                                  }
                                }}
                                title="Batalkan PO"
                                style={{ padding: '5px', color: '#f87171' }}
                              >
                                <Ban size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px', overflow: 'hidden' }}>
          {/* Toolbar: Search, Status filter, Add button */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                placeholder="Cari nama supplier, PIC, telepon, email..."
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>

            <select
              className="input-field"
              value={supplierStatusFilter}
              onChange={e => setSupplierStatusFilter(e.target.value as any)}
              style={{ width: '150px', padding: '6px 8px', fontSize: '12px' }}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Non-Aktif Saja</option>
            </select>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSupplierToEdit(null);
                setIsSupplierModalOpen(true);
              }}
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>Tambah Supplier</span>
            </button>
          </div>

          {/* Supplier Table */}
          <div className="data-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Supplier</th>
                  <th style={{ width: '160px' }}>Contact Person</th>
                  <th style={{ width: '150px' }}>Telepon</th>
                  <th style={{ width: '180px' }}>Email</th>
                  <th>Catatan / Alamat</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                      Tidak ada data supplier yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(sup => (
                    <tr key={sup.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-bright)' }}>
                        {sup.name}
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>
                        {sup.contactPerson || '-'}
                      </td>
                      <td style={{ color: 'var(--text-dim)' }} className="font-mono">
                        {sup.phone || '-'}
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>
                        {sup.email || '-'}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {sup.address ? `${sup.address}` : sup.notes || '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            background: sup.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: sup.status === 'ACTIVE' ? '#34d399' : '#fb7185',
                            border: sup.status === 'ACTIVE' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                          }}
                        >
                          {sup.status === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {/* Edit button */}
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => {
                              setSupplierToEdit(sup);
                              setIsSupplierModalOpen(true);
                            }}
                            title="Edit Supplier"
                          >
                            <Edit3 size={15} />
                          </button>

                          {/* Toggle Active/Inactive */}
                          <button
                            type="button"
                            onClick={() => toggleSupplierStatus(sup.id)}
                            style={{
                              padding: '3px 8px',
                              background: sup.status === 'ACTIVE' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                              color: sup.status === 'ACTIVE' ? '#fb7185' : '#34d399',
                              border: sup.status === 'ACTIVE' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                            title={sup.status === 'ACTIVE' ? 'Non-aktifkan supplier' : 'Aktifkan supplier'}
                          >
                            {sup.status === 'ACTIVE' ? 'Nonaktif' : 'Aktifkan'}
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => {
                              if (confirm(`Hapus supplier "${sup.name}"? Jika sudah ada riwayat PO, supplier hanya akan dinonaktifkan.`)) {
                                deleteSupplier(sup.id);
                              }
                            }}
                            title="Hapus Supplier"
                            style={{ color: 'var(--text-dim)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECEIVING HISTORY */}
      {activeTab === 'receiving' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '12px', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                value={receivingSearch}
                onChange={e => setReceivingSearch(e.target.value)}
                placeholder="Cari No. Penerimaan, No. PO, Supplier, produk..."
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-bright)',
                  fontSize: '12px',
                  width: '100%',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Receiving Table */}
          <div className="data-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '160px' }}>No. Penerimaan</th>
                  <th style={{ width: '150px' }}>No. PO Terkait</th>
                  <th>Supplier</th>
                  <th style={{ width: '160px' }}>Waktu Terima</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Total Fisik</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Total Nilai (Rp)</th>
                  <th style={{ width: '140px' }}>Petugas</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceivingRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                      Belum ada catatan riwayat penerimaan barang.
                    </td>
                  </tr>
                ) : (
                  filteredReceivingRecords.map(rcv => (
                    <tr key={rcv.id}>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--cyan)' }}>
                        {rcv.receivingNumber}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--text-bright)' }}>
                        {rcv.poNumber}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {rcv.supplierName}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {formatPurchasingDate(rcv.receivedAt)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }} className="font-mono">
                        +{rcv.totalQuantity} pcs
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--cyan)' }} className="font-mono">
                        {formatRupiah(rcv.totalCost)}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {rcv.receivedBy}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => {
                            setSelectedReceivingRecord(rcv);
                            setIsReceivingDetailOpen(true);
                          }}
                          title="Lihat Rincian Penerimaan"
                          style={{ padding: '5px' }}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Supplier Add/Edit Modal */}
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSupplierToEdit(null);
        }}
        onSave={async data => {
          if ('id' in data) {
            return await updateSupplier(data as Supplier);
          } else {
            return await addSupplier(data);
          }
        }}
        supplierToEdit={supplierToEdit}
      />

      {/* 2. Create PO Modal */}
      <CreatePoModal
        isOpen={isCreatePoModalOpen}
        onClose={() => setIsCreatePoModalOpen(false)}
        suppliers={suppliers}
        products={products}
        onSubmit={async data => {
          return await createPurchaseOrder(data);
        }}
      />

      {/* 3. PO Detail Modal */}
      <PoDetailModal
        isOpen={isPoDetailOpen}
        onClose={() => {
          setIsPoDetailOpen(false);
          setSelectedPoForDetail(null);
        }}
        po={selectedPoForDetail}
        onReceiveClick={po => {
          setSelectedPoForReceive(po);
          setIsReceiveModalOpen(true);
        }}
        onStatusChange={async (poId, status) => {
          await updatePurchaseOrderStatus(poId, status);
          const updated = purchaseOrders.find(p => p.id === poId);
          if (updated) setSelectedPoForDetail({ ...updated, status });
        }}
        onCancelPo={async (poId, reason) => {
          await cancelPurchaseOrder(poId, reason);
        }}
      />

      {/* 4. Receive Goods Modal */}
      <ReceiveGoodsModal
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setSelectedPoForReceive(null);
        }}
        po={selectedPoForReceive}
        cashierName={settings.cashierName}
        onConfirmReceiving={async params => {
          return await executeReceiving(params);
        }}
      />

      {/* 5. Receiving Detail Modal */}
      <ReceivingDetailModal
        isOpen={isReceivingDetailOpen}
        onClose={() => {
          setIsReceivingDetailOpen(false);
          setSelectedReceivingRecord(null);
        }}
        record={selectedReceivingRecord}
      />
    </div>
  );
};
