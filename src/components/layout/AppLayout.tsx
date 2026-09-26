import React from 'react';
import { usePos } from '../../context/PosContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomBar } from './BottomBar';
import { PosPage } from '../../pages/PosPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { TransactionsPage } from '../../pages/TransactionsPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { ReportsPage } from '../../pages/ReportsPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { CheckoutModal } from '../pos/CheckoutModal';
import { ThermalReceipt } from '../pos/ThermalReceipt';
import { ToastContainer } from '../common/Toast';
import { X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentPage, selectedReceiptTx, isCheckoutOpen, closeReceiptModal, settings, toasts, dismissToast } = usePos();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'pos':
        return <PosPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'products':
        return <ProductsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <PosPage />;
    }
  };

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <TopBar />
        
        <main className="page-body">
          {renderCurrentPage()}
        </main>

        <BottomBar />
      </div>

      {/* Checkout & Payment Modal */}
      <CheckoutModal />

      {/* Standalone Receipt Modal (e.g. from Recent Transactions or Detail click) */}
      {!isCheckoutOpen && selectedReceiptTx && (
        <div className="modal-overlay" onClick={closeReceiptModal}>
          <div
            style={{
              background: '#0b111f',
              border: '1px solid var(--border-muted)',
              borderRadius: 'var(--radius-xl)',
              padding: '24px',
              maxWidth: '380px',
              width: '90vw',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                color: 'var(--text-dim)',
                padding: '4px',
              }}
              onClick={closeReceiptModal}
              title="Tutup (Esc)"
            >
              <X size={18} />
            </button>

            <ThermalReceipt
              transaction={selectedReceiptTx}
              settings={settings}
              onNewTransaction={closeReceiptModal}
            />
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
