import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

interface UseCapacitorOptions {
  isCheckoutOpen: boolean;
  closeCheckout: () => void;
  selectedReceiptTx: any;
  closeReceiptModal: () => void;
  isBoothModalOpen?: boolean;
  closeBoothModal?: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: any) => void;
  mobilePosTab?: 'catalog' | 'cart';
  setMobilePosTab?: (tab: 'catalog' | 'cart') => void;
}

export function useCapacitorNative({
  isCheckoutOpen,
  closeCheckout,
  selectedReceiptTx,
  closeReceiptModal,
  isBoothModalOpen,
  closeBoothModal,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  currentPage,
  setCurrentPage,
  mobilePosTab,
  setMobilePosTab,
}: UseCapacitorOptions) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Configure Status Bar style and background
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#070b14' }).catch(() => {});

    // Hide Splash Screen after React mount
    SplashScreen.hide().catch(() => {});

    // Register safe Android Back Button listener
    const listenerPromise = CapApp.addListener('backButton', () => {
      // Priority 1: Standalone Receipt Modal
      if (selectedReceiptTx) {
        closeReceiptModal();
        return;
      }

      // Priority 2: Booth Modal
      if (isBoothModalOpen && closeBoothModal) {
        closeBoothModal();
        return;
      }

      // Priority 3: Checkout Modal (closes safely without submitting or clearing cart)
      if (isCheckoutOpen) {
        closeCheckout();
        return;
      }

      // Priority 3: Mobile Sidebar Drawer
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
        return;
      }

      // Priority 4: If on another page, go back to POS page
      if (currentPage !== 'pos') {
        setCurrentPage('pos');
        return;
      }

      // Priority 5: If on POS mobile cart view, go back to catalog view
      if (mobilePosTab === 'cart' && setMobilePosTab) {
        setMobilePosTab('catalog');
        return;
      }

      // Priority 6: At root POS with nothing open -> safely exit app
      CapApp.exitApp();
    });

    return () => {
      listenerPromise.then(sub => sub.remove()).catch(() => {});
    };
  }, [
    isCheckoutOpen,
    closeCheckout,
    selectedReceiptTx,
    closeReceiptModal,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    currentPage,
    setCurrentPage,
    mobilePosTab,
    setMobilePosTab,
  ]);
}
