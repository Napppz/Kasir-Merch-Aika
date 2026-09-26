import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { 
  Product, 
  Category, 
  Transaction, 
  CartItem, 
  BoothSettings, 
  NavigationPage, 
  PaymentMethod,
  StockMovement,
  StockMovementType,
  StockOpnameSession,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  ReceivingRecord,
  PurchaseOrderStatus,
} from '../types';
import { offlineDB } from '../db/indexedDB';
import { INITIAL_BOOTH_SETTINGS } from '../db/seedData';
import { generateInvoiceNumber } from '../utils/formatters';
import { soundFX } from '../utils/sound';
import type { ToastMessage } from '../components/common/Toast';

interface PosContextType {
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  cart: CartItem[];
  activeCategory: string;
  searchQuery: string;
  discountCode: string;
  discountAmount: number;
  transactionNote: string;
  settings: BoothSettings;
  currentPage: NavigationPage;
  isCheckoutOpen: boolean;
  selectedReceiptTx: Transaction | null;
  currentTimeString: string;
  toasts: ToastMessage[];

  // Stock Management (Tahap 3)
  stockMovements: StockMovement[];
  opnameSessions: StockOpnameSession[];

  // Purchasing & Suppliers (Tahap 6)
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  receivingRecords: ReceivingRecord[];
  
  // Actions
  setCurrentPage: (page: NavigationPage) => void;
  setActiveCategory: (catId: string) => void;
  setSearchQuery: (query: string) => void;
  setDiscountCode: (code: string) => void;
  setTransactionNote: (note: string) => void;
  applyDiscountCode: (code: string) => boolean;
  
  addToCart: (product: Product) => boolean;
  updateCartQuantity: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  openCheckout: () => void;
  closeCheckout: () => void;
  openReceiptModal: (tx: Transaction) => void;
  closeReceiptModal: () => void;
  
  processPayment: (method: PaymentMethod, paymentAmount: number) => Promise<Transaction>;
  simulateScanProduct: () => void;
  quickAddStock: (productId: string, amount: number) => Promise<void>;

  // Stock Operations (Tahap 3)
  stockIn: (params: { productId: string; quantity: number; reason: string; note?: string }) => Promise<{ success: boolean; error?: string }>;
  adjustStock: (params: { productId: string; adjustmentType: 'increase' | 'decrease'; quantity: number; reason: string; note?: string }) => Promise<{ success: boolean; error?: string }>;
  submitOpnameSession: (session: StockOpnameSession) => Promise<{ success: boolean; error?: string }>;
  refreshStockData: () => Promise<void>;
  getLastProductMovement: (productId: string) => StockMovement | undefined;
  getProductMovements: (productId: string) => StockMovement[];

  // Master Data Operations (Tahap 2)
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateProduct: (product: Product) => Promise<{ success: boolean; error?: string }>;
  toggleProductStatus: (productId: string) => Promise<void>;
  isProductInTransactions: (productId: string) => boolean;

  addCategory: (categoryData: Omit<Category, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateCategory: (category: Category) => Promise<{ success: boolean; error?: string }>;
  toggleCategoryStatus: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
  isCategoryInUse: (categoryId: string) => boolean;

  // Purchasing & Suppliers Operations (Tahap 6)
  addSupplier: (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; error?: string }>;
  updateSupplier: (supplier: Supplier) => Promise<{ success: boolean; error?: string }>;
  toggleSupplierStatus: (supplierId: string) => Promise<{ success: boolean; error?: string }>;
  deleteSupplier: (supplierId: string) => Promise<{ success: boolean; softDeleted?: boolean; error?: string }>;
  isSupplierInUse: (supplierId: string) => boolean;
  createPurchaseOrder: (poData: {
    supplierId: string;
    expectedDate?: string;
    notes?: string;
    items: { productId: string; qtyOrdered: number; unitCost: number }[];
    status?: PurchaseOrderStatus;
  }) => Promise<{ success: boolean; po?: PurchaseOrder; error?: string }>;
  updatePurchaseOrderStatus: (poId: string, newStatus: PurchaseOrderStatus) => Promise<{ success: boolean; error?: string }>;
  cancelPurchaseOrder: (poId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  executeReceiving: (params: {
    purchaseOrderId: string;
    receivedBy: string;
    notes?: string;
    items: { productId: string; qtyReceivedNow: number; actualUnitCost?: number }[];
  }) => Promise<{ success: boolean; receivingRecord?: ReceivingRecord; error?: string }>;
  refreshPurchasingData: () => Promise<void>;

  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  refreshAllData: () => Promise<void>;
  
  // Computed
  cartTotalQty: number;
  cartSubtotal: number;
  cartTotalAmount: number;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [transactionNote, setTransactionNote] = useState<string>('');
  const [settings, setSettings] = useState<BoothSettings>(INITIAL_BOOTH_SETTINGS);
  const [currentPage, setCurrentPage] = useState<NavigationPage>('pos');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [currentTimeString, setCurrentTimeString] = useState<string>('14:28:05 WIB');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [opnameSessions, setOpnameSessions] = useState<StockOpnameSession[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [receivingRecords, setReceivingRecords] = useState<ReceivingRecord[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Load initial data from offline IndexedDB
  useEffect(() => {
    async function loadData() {
      await offlineDB.initialize();
      const [prods, cats, txs, sets, movements, sessions, sups, pos, rcvs] = await Promise.all([
        offlineDB.getProducts(),
        offlineDB.getCategories(),
        offlineDB.getTransactions(),
        offlineDB.getSettings(),
        offlineDB.getStockMovements(),
        offlineDB.getOpnameSessions(),
        offlineDB.getSuppliers(),
        offlineDB.getPurchaseOrders(),
        offlineDB.getReceivingRecords(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setTransactions(txs);
      if (sets) {
        setSettings({
          ...INITIAL_BOOTH_SETTINGS,
          ...sets,
          qrisMerchantName: sets.qrisMerchantName || INITIAL_BOOTH_SETTINGS.qrisMerchantName,
          qrisNmid: sets.qrisNmid || INITIAL_BOOTH_SETTINGS.qrisNmid,
          qrisTerminalCode: sets.qrisTerminalCode || INITIAL_BOOTH_SETTINGS.qrisTerminalCode,
          qrisImageUrl: sets.qrisImageUrl || INITIAL_BOOTH_SETTINGS.qrisImageUrl,
        });
      }
      setStockMovements(movements);
      setOpnameSessions(sessions);
      setSuppliers(sups);
      setPurchaseOrders(pos);
      setReceivingRecords(rcvs);
    }
    loadData();
  }, []);

  // Real-time clock update (Format: HH:mm:ss WIB)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeString(`${h}:${m}:${s} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cart calculations
  const cartTotalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartTotalAmount = Math.max(0, cartSubtotal - discountAmount);

  // Add to cart with stock validation & active check
  const addToCart = useCallback((product: Product): boolean => {
    if (!product.isActive || product.stock <= 0) {
      soundFX.playErrorBuzz();
      return false;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          soundFX.playErrorBuzz();
          return prev;
        }
        soundFX.playScannerBeep();
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        soundFX.playScannerBeep();
        return [...prev, { product, quantity: 1 }];
      }
    });
    return true;
  }, []);

  const updateCartQuantity = useCallback((productId: string, qty: number) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (qty > target.stock) {
      soundFX.playErrorBuzz();
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  }, [products]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountAmount(0);
    setDiscountCode('');
    setTransactionNote('');
  }, []);

  const applyDiscountCode = useCallback((code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'COMICFEST' || clean === 'EVENT10') {
      const discount = Math.round(cartSubtotal * 0.1);
      setDiscountAmount(discount);
      setDiscountCode(clean);
      return true;
    } else if (clean === 'PASSER5') {
      setDiscountAmount(5000);
      setDiscountCode(clean);
      return true;
    }
    soundFX.playErrorBuzz();
    return false;
  }, [cartSubtotal]);

  const openCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setIsCheckoutOpen(true);
  }, [cart.length]);

  const closeCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
  }, []);

  const openReceiptModal = useCallback((tx: Transaction) => {
    setSelectedReceiptTx(tx);
  }, []);

  const closeReceiptModal = useCallback(() => {
    setSelectedReceiptTx(null);
  }, []);

  // Process transaction atomically
  const processPayment = useCallback(async (
    method: PaymentMethod,
    paymentAmount: number
  ): Promise<Transaction> => {
    const now = new Date();
    const sequenceNumber = transactions.length + 1;
    const invNumber = generateInvoiceNumber(sequenceNumber);

    // Pre-flight stock sufficiency validation
    for (const item of cart) {
      const p = products.find(prod => prod.id === item.product.id);
      if (!p || p.stock < item.quantity) {
        soundFX.playErrorBuzz();
        addToast(`Stok untuk "${item.product.name}" tidak mencukupi (tersedia: ${p ? p.stock : 0})!`, 'error');
        throw new Error(`Stok tidak mencukupi untuk "${item.product.name}"`);
      }
    }

    const items = cart.map((item, idx) => ({
      id: `txi-${sequenceNumber}-${idx + 1}`,
      transactionId: `tx-${sequenceNumber}`,
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      price: Math.round(item.product.price),
      quantity: item.quantity,
      subtotal: Math.round(item.product.price * item.quantity),
      image: item.product.image,
    }));

    const subtotalInt = Math.round(cartSubtotal);
    const discountInt = Math.round(discountAmount);
    const totalInt = Math.round(cartTotalAmount);
    const payInt = Math.round(paymentAmount);
    const changeInt = Math.max(0, payInt - totalInt);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      transactionNumber: invNumber,
      transactionDate: now.toISOString(),
      subtotal: subtotalInt,
      discount: discountInt,
      discountCode: discountCode || undefined,
      total: totalInt,
      paymentAmount: payInt,
      changeAmount: changeInt,
      paymentMethod: method,
      cashierName: `${settings.cashierName} (${settings.cashierId})`,
      status: 'success',
      terminalId: settings.terminalId,
      notes: transactionNote || undefined,
      items: items,
      synced: false,
    };

    // Save to IndexedDB & atomic stock reduction & SALE movements
    await offlineDB.createTransaction(newTx);

    // Refresh movements from DB so SALE movements are reflected
    const freshMovements = await offlineDB.getStockMovements();
    setStockMovements(freshMovements);

    // Update local products state with deducted stock
    setProducts(prev =>
      prev.map(prod => {
        const cartItem = cart.find(ci => ci.product.id === prod.id);
        if (cartItem) {
          return {
            ...prod,
            stock: Math.max(0, prod.stock - cartItem.quantity),
            updatedAt: now.toISOString(),
          };
        }
        return prod;
      })
    );

    // Update transactions list
    setTransactions(prev => [newTx, ...prev]);

    // Play pleasant cash register chime
    soundFX.playSuccessChime();

    // Prepare receipt
    setSelectedReceiptTx(newTx);

    // Clear cart
    clearCart();

    return newTx;
  }, [
    cart,
    cartSubtotal,
    discountAmount,
    discountCode,
    cartTotalAmount,
    transactionNote,
    transactions.length,
    settings,
    clearCart,
  ]);

  // Simulate scanning a random in-stock item (active only)
  const simulateScanProduct = useCallback(() => {
    const available = products.filter(p => p.isActive && p.stock > 0);
    if (available.length === 0) {
      soundFX.playErrorBuzz();
      return;
    }
    const randomProduct = available[Math.floor(Math.random() * available.length)];
    addToCart(randomProduct);
  }, [products, addToCart]);

  // Stock In (Tahap 3 - Bagian 6)
  const stockIn = useCallback(async (params: {
    productId: string;
    quantity: number;
    reason: string;
    note?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!params.productId) return { success: false, error: 'Pilih merchandise terlebih dahulu.' };
    const qty = Math.floor(params.quantity);
    if (isNaN(qty) || qty <= 0) return { success: false, error: 'Jumlah stok masuk wajib integer dan lebih dari 0.' };
    if (!params.reason) return { success: false, error: 'Alasan stok masuk wajib dipilih.' };

    try {
      const result = await offlineDB.updateProductStock({
        productId: params.productId,
        type: 'STOCK_IN',
        quantity: qty,
        reason: params.reason,
        note: params.note,
        createdBy: settings.cashierName || 'Operator Booth',
      });

      setProducts(prev => prev.map(p => p.id === params.productId ? result.product : p));
      setStockMovements(prev => [result.movement, ...prev]);
      soundFX.playScannerBeep();
      addToast(`Stok "${result.product.name}" bertambah +${qty} pcs (${result.movement.stockBefore} → ${result.movement.stockAfter}).`, 'success');
      return { success: true };
    } catch (err: any) {
      soundFX.playErrorBuzz();
      addToast(err?.message || 'Gagal menambahkan stok.', 'error');
      return { success: false, error: err?.message };
    }
  }, [settings.cashierName, addToast]);

  // Stock Adjustment (Tahap 3 - Bagian 7)
  const adjustStock = useCallback(async (params: {
    productId: string;
    adjustmentType: 'increase' | 'decrease';
    quantity: number;
    reason: string;
    note?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!params.productId) return { success: false, error: 'Pilih merchandise terlebih dahulu.' };
    const qty = Math.floor(params.quantity);
    if (isNaN(qty) || qty <= 0) return { success: false, error: 'Jumlah penyesuaian harus lebih dari 0.' };
    if (!params.reason) return { success: false, error: 'Alasan penyesuaian stok wajib dipilih.' };

    let movementType: StockMovementType;
    if (params.adjustmentType === 'increase') {
      movementType = 'ADJUSTMENT_IN';
    } else {
      if (params.reason === 'Barang Rusak') {
        movementType = 'DAMAGE';
      } else if (params.reason === 'Barang Hilang') {
        movementType = 'LOST';
      } else {
        movementType = 'ADJUSTMENT_OUT';
      }
    }

    try {
      const result = await offlineDB.updateProductStock({
        productId: params.productId,
        type: movementType,
        quantity: qty,
        reason: params.reason,
        note: params.note,
        createdBy: settings.cashierName || 'Operator Booth',
      });

      setProducts(prev => prev.map(p => p.id === params.productId ? result.product : p));
      setStockMovements(prev => [result.movement, ...prev]);
      soundFX.playScannerBeep();
      const changeSign = params.adjustmentType === 'increase' ? `+${qty}` : `-${qty}`;
      addToast(`Penyesuaian stok "${result.product.name}" berhasil (${changeSign} pcs, kini ${result.movement.stockAfter} pcs).`, 'success');
      return { success: true };
    } catch (err: any) {
      soundFX.playErrorBuzz();
      addToast(err?.message || 'Gagal menyesuaikan stok.', 'error');
      return { success: false, error: err?.message };
    }
  }, [settings.cashierName, addToast]);

  // Restock action for booth operator (delegates to stockIn with proper movement logging)
  const quickAddStock = useCallback(async (productId: string, amount: number) => {
    await stockIn({
      productId,
      quantity: amount,
      reason: 'Restock',
      note: 'Quick restock dari booth card',
    });
  }, [stockIn]);

  // Stock Opname Session Application (Tahap 3 - Bagian 8, 9, 10)
  const submitOpnameSession = useCallback(async (
    session: StockOpnameSession
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await offlineDB.applyStockOpnameSession(session, settings.cashierName || 'Operator Booth');
      const [prods, movements, sessions] = await Promise.all([
        offlineDB.getProducts(),
        offlineDB.getStockMovements(),
        offlineDB.getOpnameSessions(),
      ]);
      setProducts(prods);
      setStockMovements(movements);
      setOpnameSessions(sessions);
      soundFX.playSuccessChime();
      addToast(`Sesi Stock Opname ${session.opnameNumber} berhasil diterapkan! Stok telah disinkronkan.`, 'success');
      return { success: true };
    } catch (err: any) {
      soundFX.playErrorBuzz();
      addToast(err?.message || 'Gagal menerapkan sesi stock opname.', 'error');
      return { success: false, error: err?.message };
    }
  }, [addToast]);

  // Refresh stock data from DB
  const refreshStockData = useCallback(async () => {
    const [prods, movements, sessions] = await Promise.all([
      offlineDB.getProducts(),
      offlineDB.getStockMovements(),
      offlineDB.getOpnameSessions(),
    ]);
    setProducts(prods);
    setStockMovements(movements);
    setOpnameSessions(sessions);
  }, []);

  // Refresh purchasing data from DB (Tahap 6)
  const refreshPurchasingData = useCallback(async () => {
    const [sups, pos, rcvs] = await Promise.all([
      offlineDB.getSuppliers(),
      offlineDB.getPurchaseOrders(),
      offlineDB.getReceivingRecords(),
    ]);
    setSuppliers(sups);
    setPurchaseOrders(pos);
    setReceivingRecords(rcvs);
  }, []);

  // Refresh all application state from IndexedDB (Tahap 5 & 6)
  const refreshAllData = useCallback(async () => {
    const [prods, cats, txs, sets, movements, sessions, sups, pos, rcvs] = await Promise.all([
      offlineDB.getProducts(),
      offlineDB.getCategories(),
      offlineDB.getTransactions(),
      offlineDB.getSettings(),
      offlineDB.getStockMovements(),
      offlineDB.getOpnameSessions(),
      offlineDB.getSuppliers(),
      offlineDB.getPurchaseOrders(),
      offlineDB.getReceivingRecords(),
    ]);
    setProducts(prods);
    setCategories(cats);
    setTransactions(txs);
    if (sets) setSettings(sets);
    setStockMovements(movements);
    setOpnameSessions(sessions);
    setSuppliers(sups);
    setPurchaseOrders(pos);
    setReceivingRecords(rcvs);
    setCart([]);
    setDiscountAmount(0);
    setDiscountCode('');
    setTransactionNote('');
  }, []);

  // Helpers for Stock Movement
  const getLastProductMovement = useCallback((productId: string): StockMovement | undefined => {
    return stockMovements.find(m => m.productId === productId);
  }, [stockMovements]);

  const getProductMovements = useCallback((productId: string): StockMovement[] => {
    return stockMovements.filter(m => m.productId === productId);
  }, [stockMovements]);

  // Product Operations
  const isProductInTransactions = useCallback((productId: string): boolean => {
    return transactions.some(tx => tx.items.some(item => item.productId === productId));
  }, [transactions]);

  const addProduct = useCallback(async (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!productData.name || productData.name.trim().length < 2) {
      return { success: false, error: 'Nama produk minimal 2 karakter.' };
    }

    if (!productData.sku || !productData.sku.trim()) {
      return { success: false, error: 'SKU produk wajib diisi.' };
    }

    const isSkuUnique = await offlineDB.checkSkuUnique(productData.sku);
    if (!isSkuUnique) {
      return { success: false, error: 'SKU sudah digunakan oleh produk lain.' };
    }

    if (productData.price < 0 || productData.costPrice < 0) {
      return { success: false, error: 'Harga jual atau harga modal tidak boleh negatif.' };
    }

    if (productData.stock < 0 || productData.minimumStock < 0) {
      return { success: false, error: 'Stok tidak boleh bernilai negatif.' };
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sku: productData.sku.trim().toUpperCase(),
      createdAt: now,
      updatedAt: now,
    };

    await offlineDB.saveProduct(newProduct);
    if (newProduct.stock > 0) {
      const initMovement: StockMovement = {
        id: `sm-init-${newProduct.id}`,
        productId: newProduct.id,
        type: 'INITIAL',
        quantity: newProduct.stock,
        stockBefore: 0,
        stockAfter: newProduct.stock,
        reason: 'Stok Awal Produk Baru',
        referenceId: newProduct.sku,
        note: 'Stok awal saat pendaftaran produk baru',
        createdAt: now,
        createdBy: settings.cashierName || 'Operator Booth',
      };
      await offlineDB.addStockMovement(initMovement);
      setStockMovements(prev => [initMovement, ...prev]);
    }

    setProducts(prev => [newProduct, ...prev]);
    soundFX.playScannerBeep();
    addToast(`Produk "${newProduct.name}" berhasil ditambahkan!`, 'success');
    return { success: true };
  }, [settings.cashierName, addToast]);

  const updateProduct = useCallback(async (
    product: Product
  ): Promise<{ success: boolean; error?: string }> => {
    if (!product.name || product.name.trim().length < 2) {
      return { success: false, error: 'Nama produk minimal 2 karakter.' };
    }

    if (!product.sku || !product.sku.trim()) {
      return { success: false, error: 'SKU produk wajib diisi.' };
    }

    const isSkuUnique = await offlineDB.checkSkuUnique(product.sku, product.id);
    if (!isSkuUnique) {
      return { success: false, error: 'SKU sudah digunakan oleh produk lain.' };
    }

    if (product.price < 0 || product.costPrice < 0) {
      return { success: false, error: 'Harga tidak boleh negatif.' };
    }

    if (product.stock < 0 || product.minimumStock < 0) {
      return { success: false, error: 'Stok tidak boleh bernilai negatif.' };
    }

    const updated: Product = {
      ...product,
      sku: product.sku.trim().toUpperCase(),
      updatedAt: new Date().toISOString(),
    };

    await offlineDB.saveProduct(updated);
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    addToast(`Perubahan "${updated.name}" berhasil disimpan!`, 'success');
    return { success: true };
  }, [addToast]);

  const toggleProductStatus = useCallback(async (productId: string) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    const updated: Product = {
      ...target,
      isActive: !target.isActive,
      updatedAt: new Date().toISOString(),
    };

    await offlineDB.saveProduct(updated);
    setProducts(prev => prev.map(p => (p.id === productId ? updated : p)));
    addToast(
      `Produk "${updated.name}" telah ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
      updated.isActive ? 'success' : 'info'
    );
  }, [products, addToast]);

  // Category Operations
  const isCategoryInUse = useCallback((categoryId: string): boolean => {
    return products.some(p => p.categoryId === categoryId);
  }, [products]);

  const addCategory = useCallback(async (
    categoryData: Omit<Category, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = categoryData.name.trim();
    if (!cleanName) {
      return { success: false, error: 'Nama kategori wajib diisi.' };
    }

    const isUnique = await offlineDB.checkCategoryNameUnique(cleanName);
    if (!isUnique) {
      return { success: false, error: 'Kategori dengan nama tersebut sudah ada.' };
    }

    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      name: cleanName,
    };

    await offlineDB.saveCategory(newCategory);
    setCategories(prev => [...prev, newCategory]);
    addToast(`Kategori "${newCategory.name}" berhasil dibuat!`, 'success');
    return { success: true };
  }, [addToast]);

  const updateCategory = useCallback(async (
    category: Category
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = category.name.trim();
    if (!cleanName) {
      return { success: false, error: 'Nama kategori wajib diisi.' };
    }

    const isUnique = await offlineDB.checkCategoryNameUnique(cleanName, category.id);
    if (!isUnique) {
      return { success: false, error: 'Kategori dengan nama tersebut sudah ada.' };
    }

    const updated: Category = {
      ...category,
      name: cleanName,
    };

    await offlineDB.saveCategory(updated);
    setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    addToast(`Kategori "${updated.name}" berhasil diperbarui!`, 'success');
    return { success: true };
  }, [addToast]);

  const toggleCategoryStatus = useCallback(async (
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = categories.find(c => c.id === categoryId);
    if (!target) return { success: false, error: 'Kategori tidak ditemukan' };

    const updated: Category = {
      ...target,
      isActive: !target.isActive,
    };

    await offlineDB.saveCategory(updated);
    setCategories(prev => prev.map(c => (c.id === categoryId ? updated : c)));
    addToast(
      `Kategori "${updated.name}" telah ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
      updated.isActive ? 'success' : 'info'
    );
    return { success: true };
  }, [categories, addToast]);

  const deleteCategory = useCallback(async (
    categoryId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const inUse = isCategoryInUse(categoryId);
    if (inUse) {
      return {
        success: false,
        error: 'Kategori tidak dapat dihapus karena masih digunakan oleh produk. Anda dapat menonaktifkannya.',
      };
    }

    await offlineDB.deleteCategory(categoryId);
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    addToast('Kategori berhasil dihapus.', 'success');
    return { success: true };
  }, [isCategoryInUse, addToast]);

  // --- SUPPLIER OPERATIONS (TAHAP 6) ---
  const isSupplierInUse = useCallback((supplierId: string): boolean => {
    return purchaseOrders.some(po => po.supplierId === supplierId);
  }, [purchaseOrders]);

  const addSupplier = useCallback(async (
    supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = supplierData.name.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Nama supplier minimal 2 karakter.' };
    }

    const isUnique = await offlineDB.checkSupplierNameUnique(cleanName);
    if (!isUnique) {
      return { success: false, error: `Supplier "${cleanName}" sudah terdaftar.` };
    }

    if (supplierData.email && supplierData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supplierData.email.trim())) {
        return { success: false, error: 'Format email tidak valid.' };
      }
    }

    const now = new Date().toISOString();
    const newSupplier: Supplier = {
      ...supplierData,
      id: `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: cleanName,
      status: supplierData.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    await offlineDB.saveSupplier(newSupplier);
    setSuppliers(prev => [newSupplier, ...prev]);
    addToast(`Supplier "${newSupplier.name}" berhasil ditambahkan!`, 'success');
    return { success: true };
  }, [addToast]);

  const updateSupplier = useCallback(async (
    supplier: Supplier
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = supplier.name.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Nama supplier minimal 2 karakter.' };
    }

    const isUnique = await offlineDB.checkSupplierNameUnique(cleanName, supplier.id);
    if (!isUnique) {
      return { success: false, error: `Nama supplier "${cleanName}" sudah digunakan.` };
    }

    if (supplier.email && supplier.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(supplier.email.trim())) {
        return { success: false, error: 'Format email tidak valid.' };
      }
    }

    const updated: Supplier = {
      ...supplier,
      name: cleanName,
      updatedAt: new Date().toISOString(),
    };

    await offlineDB.saveSupplier(updated);
    setSuppliers(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    addToast(`Supplier "${updated.name}" berhasil diperbarui!`, 'success');
    return { success: true };
  }, [addToast]);

  const toggleSupplierStatus = useCallback(async (
    supplierId: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = suppliers.find(s => s.id === supplierId);
    if (!target) return { success: false, error: 'Supplier tidak ditemukan.' };

    const newStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated: Supplier = {
      ...target,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await offlineDB.saveSupplier(updated);
    setSuppliers(prev => prev.map(s => (s.id === supplierId ? updated : s)));
    addToast(
      `Supplier "${updated.name}" sekarang ${newStatus === 'ACTIVE' ? 'AKTIF' : 'NON-AKTIF'}.`,
      newStatus === 'ACTIVE' ? 'success' : 'info'
    );
    return { success: true };
  }, [suppliers, addToast]);

  const deleteSupplier = useCallback(async (
    supplierId: string
  ): Promise<{ success: boolean; softDeleted?: boolean; error?: string }> => {
    const res = await offlineDB.deleteSupplier(supplierId);
    if (res.success) {
      if (res.softDeleted) {
        addToast('Supplier memiliki riwayat PO. Status dinonaktifkan (INACTIVE) untuk menjaga integritas data.', 'info');
      } else {
        addToast('Supplier berhasil dihapus.', 'success');
      }
      const updatedList = await offlineDB.getSuppliers();
      setSuppliers(updatedList);
    }
    return res;
  }, [addToast]);

  // --- PURCHASE ORDER OPERATIONS (TAHAP 6) ---
  const createPurchaseOrder = useCallback(async (poData: {
    supplierId: string;
    expectedDate?: string;
    notes?: string;
    items: { productId: string; qtyOrdered: number; unitCost: number }[];
    status?: PurchaseOrderStatus;
  }): Promise<{ success: boolean; po?: PurchaseOrder; error?: string }> => {
    const supplier = suppliers.find(s => s.id === poData.supplierId);
    if (!supplier) {
      return { success: false, error: 'Supplier tidak ditemukan.' };
    }

    if (supplier.status === 'INACTIVE') {
      return { success: false, error: 'Supplier yang berstatus INACTIVE tidak dapat dipilih untuk PO baru.' };
    }

    if (!poData.items || poData.items.length === 0) {
      return { success: false, error: 'Harus memilih minimal 1 item produk untuk PO.' };
    }

    for (const item of poData.items) {
      if (item.qtyOrdered <= 0) {
        return { success: false, error: 'Kuantitas pesanan harus lebih besar dari 0.' };
      }
      if (item.unitCost < 0) {
        return { success: false, error: 'Harga satuan modal tidak boleh negatif.' };
      }
    }

    const poNumber = await offlineDB.generatePoNumber();
    const poId = `po-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nowIso = new Date().toISOString();

    const poItems: PurchaseOrderItem[] = poData.items.map((it, idx) => {
      const prod = products.find(p => p.id === it.productId);
      return {
        id: `poi-${poId}-${idx + 1}`,
        purchaseOrderId: poId,
        productId: it.productId,
        skuSnapshot: prod?.sku || 'UNKNOWN',
        productNameSnapshot: prod?.name || 'Item Tidak Diketahui',
        qtyOrdered: it.qtyOrdered,
        qtyReceived: 0,
        unitCost: it.unitCost,
        subtotal: it.qtyOrdered * it.unitCost,
      };
    });

    const totalAmount = poItems.reduce((acc, i) => acc + i.subtotal, 0);

    const newPo: PurchaseOrder = {
      id: poId,
      poNumber,
      supplierId: supplier.id,
      supplierNameSnapshot: supplier.name,
      orderDate: nowIso,
      expectedDate: poData.expectedDate,
      status: poData.status || 'DRAFT',
      subtotal: totalAmount,
      discount: 0,
      total: totalAmount,
      notes: poData.notes,
      createdAt: nowIso,
      updatedAt: nowIso,
      items: poItems,
    };

    await offlineDB.savePurchaseOrder(newPo, poItems);
    setPurchaseOrders(prev => [newPo, ...prev]);
    soundFX.playSuccessChime();
    addToast(`Purchase Order ${newPo.poNumber} berhasil dibuat dengan status ${newPo.status}!`, 'success');
    return { success: true, po: newPo };
  }, [suppliers, products, addToast]);

  const updatePurchaseOrderStatus = useCallback(async (
    poId: string,
    newStatus: PurchaseOrderStatus
  ): Promise<{ success: boolean; error?: string }> => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return { success: false, error: 'Purchase Order tidak ditemukan.' };

    const updatedPo: PurchaseOrder = {
      ...po,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const items = po.items || (await offlineDB.getPurchaseOrderItems(poId));
    await offlineDB.savePurchaseOrder(updatedPo, items);
    setPurchaseOrders(prev => prev.map(p => (p.id === poId ? updatedPo : p)));
    addToast(`Status PO ${po.poNumber} diperbarui menjadi ${newStatus}!`, 'success');
    return { success: true };
  }, [purchaseOrders, addToast]);

  const cancelPurchaseOrder = useCallback(async (
    poId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await offlineDB.cancelPurchaseOrder(poId, reason);
      const updatedPos = await offlineDB.getPurchaseOrders();
      setPurchaseOrders(updatedPos);
      addToast('Purchase order berhasil dibatalkan.', 'info');
      return { success: true };
    } catch (err: any) {
      soundFX.playErrorBuzz();
      addToast(err?.message || 'Gagal membatalkan PO.', 'error');
      return { success: false, error: err?.message };
    }
  }, [addToast]);

  // --- RECEIVING GOODS (TAHAP 6) ---
  const executeReceiving = useCallback(async (params: {
    purchaseOrderId: string;
    receivedBy: string;
    notes?: string;
    items: { productId: string; qtyReceivedNow: number; actualUnitCost?: number }[];
  }): Promise<{ success: boolean; receivingRecord?: ReceivingRecord; error?: string }> => {
    try {
      const res = await offlineDB.executeReceiving({
        poId: params.purchaseOrderId,
        receivedBy: params.receivedBy || settings.cashierName || 'Operator Kasir',
        notes: params.notes,
        items: params.items,
      });

      if (!res.success) {
        soundFX.playErrorBuzz();
        addToast(res.error || 'Gagal memproses penerimaan barang.', 'error');
        return { success: false, error: res.error };
      }

      // Atomic refresh across all impacted state stores
      await Promise.all([
        refreshStockData(),
        refreshPurchasingData(),
      ]);

      soundFX.playSuccessChime();
      addToast(
        `Penerimaan barang #${res.receivingRecord?.receivingNumber} berhasil! Stok produk telah bertambah otomatis ke sistem.`,
        'success'
      );
      return { success: true, receivingRecord: res.receivingRecord };
    } catch (err: any) {
      soundFX.playErrorBuzz();
      addToast(err?.message || 'Terjadi kesalahan sistem saat receiving.', 'error');
      return { success: false, error: err?.message };
    }
  }, [settings.cashierName, refreshStockData, refreshPurchasingData, addToast]);

  // Global Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K -> Focus Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        if (searchInput) searchInput.focus();
        return;
      }

      // F1 -> New Transaction / Switch to POS
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentPage('pos');
        closeCheckout();
        closeReceiptModal();
        return;
      }

      // F2 -> Scan Dummy Simulation
      if (e.key === 'F2') {
        e.preventDefault();
        simulateScanProduct();
        return;
      }

      // F4 -> Focus Cart / Clear focus
      if (e.key === 'F4') {
        e.preventDefault();
        return;
      }

      // F9 -> Open Checkout
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !isCheckoutOpen) {
          openCheckout();
        }
        return;
      }

      // Esc -> Close modals
      if (e.key === 'Escape') {
        if (isCheckoutOpen) {
          e.preventDefault();
          closeCheckout();
        } else if (selectedReceiptTx) {
          e.preventDefault();
          closeReceiptModal();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart.length, isCheckoutOpen, selectedReceiptTx, openCheckout, closeCheckout, closeReceiptModal, simulateScanProduct, setCurrentPage]);

  return (
    <PosContext.Provider
      value={{
        products,
        categories,
        transactions,
        cart,
        activeCategory,
        searchQuery,
        discountCode,
        discountAmount,
        transactionNote,
        settings,
        currentPage,
        isCheckoutOpen,
        selectedReceiptTx,
        currentTimeString,
        toasts,
        stockMovements,
        opnameSessions,
        suppliers,
        purchaseOrders,
        receivingRecords,
        setCurrentPage,
        setActiveCategory,
        setSearchQuery,
        setDiscountCode,
        setTransactionNote,
        applyDiscountCode,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        openCheckout,
        closeCheckout,
        openReceiptModal,
        closeReceiptModal,
        processPayment,
        simulateScanProduct,
        quickAddStock,
        stockIn,
        adjustStock,
        submitOpnameSession,
        refreshStockData,
        getLastProductMovement,
        getProductMovements,
        addProduct,
        updateProduct,
        toggleProductStatus,
        isProductInTransactions,
        addCategory,
        updateCategory,
        toggleCategoryStatus,
        deleteCategory,
        isCategoryInUse,
        addSupplier,
        updateSupplier,
        toggleSupplierStatus,
        deleteSupplier,
        isSupplierInUse,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        cancelPurchaseOrder,
        executeReceiving,
        refreshPurchasingData,
        addToast,
        dismissToast,
        refreshAllData,
        cartTotalQty,
        cartSubtotal,
        cartTotalAmount,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
