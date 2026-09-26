import React from 'react';
import { 
  ShoppingBag, 
  LayoutDashboard, 
  Receipt, 
  Package, 
  Boxes, 
  BarChart3, 
  Settings, 
  Lock, 
  Sparkles,
  X 
} from 'lucide-react';
import { usePos } from '../../context/PosContext';
import type { NavigationPage } from '../../types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { currentPage, setCurrentPage, settings, cartTotalQty } = usePos();

  const navItems: { id: NavigationPage; label: string; icon: React.FC<{ size?: number }> }[] = [
    { id: 'pos', label: 'Kasir', icon: ShoppingBag },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'products', label: 'Produk', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleSelectNav = (page: NavigationPage) => {
    setCurrentPage(page);
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-info">
              <div className="brand-icon-box">
                <Sparkles size={18} />
              </div>
              <div className="brand-text">
                <h1>CosplayPOS</h1>
                <span>EVENT TERMINAL</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-version">POS v2.4</span>
              {onClose && (
                <button 
                  type="button" 
                  className="sidebar-close-mobile-btn" 
                  onClick={onClose}
                  aria-label="Tutup Menu"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="sidebar-nav-section">
          <div className="nav-section-title">NAVIGASI</div>
          <ul className="nav-list">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectNav(item.id)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.id === 'pos' && cartTotalQty > 0 && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          background: '#ec4899',
                          color: 'white',
                          borderRadius: '999px',
                          fontSize: '10px',
                          padding: '1px 6px',
                          fontWeight: 'bold',
                        }}
                      >
                        {cartTotalQty}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sync-status-row">
          <div className="sync-status-badge">
            <span className="sync-dot"></span>
            <span>Offline Sync Ready</span>
          </div>
          <span className="sync-queue-count">0 antrean</span>
        </div>

        <div className="cashier-user-card">
          <div className="cashier-info">
            <div className="cashier-avatar">R1</div>
            <div>
              <div className="cashier-name">{settings.cashierName}</div>
              <div className="cashier-role">{settings.cashierId}</div>
            </div>
          </div>
          <button className="lock-btn" title="Kunci Kasir (Sesi Aktif)">
            <Lock size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
