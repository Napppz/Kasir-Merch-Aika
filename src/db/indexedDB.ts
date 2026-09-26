import type { Product, Category, Transaction, BoothSettings, StockMovement, StockMovementType, StockOpnameSession, Supplier, PurchaseOrder, PurchaseOrderItem, ReceivingRecord, ReceivingRecordItem } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BOOTH_SETTINGS, INITIAL_TRANSACTIONS, INITIAL_STOCK_MOVEMENTS, INITIAL_OPNAME_SESSIONS, INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS, INITIAL_PURCHASE_ORDER_ITEMS, INITIAL_RECEIVING_RECORDS } from './seedData';

export const DB_NAME = 'CosplayPOS_DB';
export const DB_VERSION = 3; // Bumped to 3 for Supplier, Purchasing, and Receiving (Tahap 6)

export const STORES = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings',
  STOCK_MOVEMENTS: 'stock_movements',
  OPNAME_SESSIONS: 'opname_sessions',
  SUPPLIERS: 'suppliers',
  PURCHASE_ORDERS: 'purchase_orders',
  PURCHASE_ORDER_ITEMS: 'purchase_order_items',
  RECEIVING_RECORDS: 'receiving_records',
};

class OfflineDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
          productStore.createIndex('sku', 'sku', { unique: true });
          productStore.createIndex('categoryId', 'categoryId', { unique: false });
        }

        // Categories store
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
        }

        // Transactions store
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          txStore.createIndex('transactionNumber', 'transactionNumber', { unique: true });
          txStore.createIndex('transactionDate', 'transactionDate', { unique: false });
          txStore.createIndex('status', 'status', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        // Stock Movements store (Tahap 3)
        if (!db.objectStoreNames.contains(STORES.STOCK_MOVEMENTS)) {
          const movStore = db.createObjectStore(STORES.STOCK_MOVEMENTS, { keyPath: 'id' });
          movStore.createIndex('productId', 'productId', { unique: false });
          movStore.createIndex('type', 'type', { unique: false });
          movStore.createIndex('createdAt', 'createdAt', { unique: false });
          movStore.createIndex('referenceId', 'referenceId', { unique: false });
        }

        // Stock Opname Sessions store (Tahap 3)
        if (!db.objectStoreNames.contains(STORES.OPNAME_SESSIONS)) {
          const opStore = db.createObjectStore(STORES.OPNAME_SESSIONS, { keyPath: 'id' });
          opStore.createIndex('opnameNumber', 'opnameNumber', { unique: true });
          opStore.createIndex('status', 'status', { unique: false });
          opStore.createIndex('startedAt', 'startedAt', { unique: false });
        }

        // Suppliers store (Tahap 6)
        if (!db.objectStoreNames.contains(STORES.SUPPLIERS)) {
          const supStore = db.createObjectStore(STORES.SUPPLIERS, { keyPath: 'id' });
          supStore.createIndex('name', 'name', { unique: false });
          supStore.createIndex('status', 'status', { unique: false });
          supStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Purchase Orders store (Tahap 6)
        if (!db.objectStoreNames.contains(STORES.PURCHASE_ORDERS)) {
          const poStore = db.createObjectStore(STORES.PURCHASE_ORDERS, { keyPath: 'id' });
          poStore.createIndex('poNumber', 'poNumber', { unique: true });
          poStore.createIndex('supplierId', 'supplierId', { unique: false });
          poStore.createIndex('status', 'status', { unique: false });
          poStore.createIndex('orderDate', 'orderDate', { unique: false });
        }

        // Purchase Order Items store (Tahap 6)
        if (!db.objectStoreNames.contains(STORES.PURCHASE_ORDER_ITEMS)) {
          const poiStore = db.createObjectStore(STORES.PURCHASE_ORDER_ITEMS, { keyPath: 'id' });
          poiStore.createIndex('purchaseOrderId', 'purchaseOrderId', { unique: false });
          poiStore.createIndex('productId', 'productId', { unique: false });
        }

        // Receiving Records store (Tahap 6)
        if (!db.objectStoreNames.contains(STORES.RECEIVING_RECORDS)) {
          const recStore = db.createObjectStore(STORES.RECEIVING_RECORDS, { keyPath: 'id' });
          recStore.createIndex('receivingNumber', 'receivingNumber', { unique: true });
          recStore.createIndex('purchaseOrderId', 'purchaseOrderId', { unique: false });
          recStore.createIndex('receivedAt', 'receivedAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Initialize with seed data if empty (Idempotent)
  async initialize(): Promise<void> {
    try {
      const db = await this.openDB();
      const isInit = await this.getSettingItem<boolean>('is_initialized');
      
      // If already initialized once, do NOT re-seed Stage 1-3 stores (preserves user deletions, resets, or empty restores)
      if (!isInit) {
        // Check if products store already has data from previous runs
        const existingProducts = await this.getAll<Product>(STORES.PRODUCTS);
        if (existingProducts.length > 0) {
          await this.saveSettingItem('is_initialized', true);
        } else {
          // First run: seed initial data for Stages 1-3
          const prodTx = db.transaction(STORES.PRODUCTS, 'readwrite');
          const prodStore = prodTx.objectStore(STORES.PRODUCTS);
          for (const p of INITIAL_PRODUCTS) {
            prodStore.put(p);
          }

          const catTx = db.transaction(STORES.CATEGORIES, 'readwrite');
          const catStore = catTx.objectStore(STORES.CATEGORIES);
          for (const c of INITIAL_CATEGORIES) {
            catStore.put(c);
          }

          const txTx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
          const txStore = txTx.objectStore(STORES.TRANSACTIONS);
          for (const t of INITIAL_TRANSACTIONS) {
            txStore.put(t);
          }

          const settings = await this.getSettings();
          if (!settings) {
            await this.saveSettings(INITIAL_BOOTH_SETTINGS);
          }

          const movTx = db.transaction(STORES.STOCK_MOVEMENTS, 'readwrite');
          const movStore = movTx.objectStore(STORES.STOCK_MOVEMENTS);
          for (const m of INITIAL_STOCK_MOVEMENTS) {
            movStore.put(m);
          }

          const opnTx = db.transaction(STORES.OPNAME_SESSIONS, 'readwrite');
          const opnStore = opnTx.objectStore(STORES.OPNAME_SESSIONS);
          for (const o of INITIAL_OPNAME_SESSIONS) {
            opnStore.put(o);
          }

          await this.saveSettingItem('is_initialized', true);
        }
      }

      // Check Tahap 6 stores initialization (Suppliers, POs, PO items, Receiving)
      const isTahap6Init = await this.getSettingItem<boolean>('is_initialized_tahap6');
      if (!isTahap6Init) {
        const suppliers = await this.getAll<Supplier>(STORES.SUPPLIERS);
        if (suppliers.length === 0) {
          const supTx = db.transaction(STORES.SUPPLIERS, 'readwrite');
          const supStore = supTx.objectStore(STORES.SUPPLIERS);
          for (const s of INITIAL_SUPPLIERS) {
            supStore.put(s);
          }

          const poTx = db.transaction(STORES.PURCHASE_ORDERS, 'readwrite');
          const poStore = poTx.objectStore(STORES.PURCHASE_ORDERS);
          for (const po of INITIAL_PURCHASE_ORDERS) {
            poStore.put(po);
          }

          const poiTx = db.transaction(STORES.PURCHASE_ORDER_ITEMS, 'readwrite');
          const poiStore = poiTx.objectStore(STORES.PURCHASE_ORDER_ITEMS);
          for (const poi of INITIAL_PURCHASE_ORDER_ITEMS) {
            poiStore.put(poi);
          }

          const rcvTx = db.transaction(STORES.RECEIVING_RECORDS, 'readwrite');
          const rcvStore = rcvTx.objectStore(STORES.RECEIVING_RECORDS);
          for (const r of INITIAL_RECEIVING_RECORDS) {
            rcvStore.put(r);
          }
        }
        await this.saveSettingItem('is_initialized_tahap6', true);
      }
    } catch (err) {
      console.warn('IndexedDB initialization failed, falling back to memory/localStorage', err);
    }
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      const local = localStorage.getItem(`cosplaypos_${storeName}`);
      return local ? JSON.parse(local) : [];
    }
  }

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    return await this.getAll<Product>(STORES.PRODUCTS);
  }

  async saveProduct(product: Product): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
        const store = tx.objectStore(STORES.PRODUCTS);
        const req = store.put(product);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getProducts();
      const idx = list.findIndex(p => p.id === product.id);
      if (idx >= 0) list[idx] = product;
      else list.push(product);
      localStorage.setItem(`cosplaypos_${STORES.PRODUCTS}`, JSON.stringify(list));
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    const inTransactions = await this.isProductInTransactions(productId);
    if (inTransactions) {
      const prods = await this.getProducts();
      const target = prods.find(p => p.id === productId);
      if (target) {
        target.isActive = false;
        target.updatedAt = new Date().toISOString();
        await this.saveProduct(target);
      }
      return false;
    }

    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
        const store = tx.objectStore(STORES.PRODUCTS);
        const req = store.delete(productId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = (await this.getProducts()).filter(p => p.id !== productId);
      localStorage.setItem(`cosplaypos_${STORES.PRODUCTS}`, JSON.stringify(list));
      return true;
    }
  }

  async isProductInTransactions(productId: string): Promise<boolean> {
    const transactions = await this.getTransactions();
    return transactions.some(tx => tx.items.some(item => item.productId === productId));
  }

  async checkSkuUnique(sku: string, excludeProductId?: string): Promise<boolean> {
    const products = await this.getProducts();
    const cleanSku = sku.trim().toUpperCase();
    const existing = products.find(
      p => p.sku.trim().toUpperCase() === cleanSku && p.id !== excludeProductId
    );
    return !existing;
  }

  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    return await this.getAll<Category>(STORES.CATEGORIES);
  }

  async saveCategory(category: Category): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
        const store = tx.objectStore(STORES.CATEGORIES);
        const req = store.put(category);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = await this.getCategories();
      const idx = list.findIndex(c => c.id === category.id);
      if (idx >= 0) list[idx] = category;
      else list.push(category);
      localStorage.setItem(`cosplaypos_${STORES.CATEGORIES}`, JSON.stringify(list));
    }
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    const inUse = await this.isCategoryInUse(categoryId);
    if (inUse) return false;

    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.CATEGORIES, 'readwrite');
        const store = tx.objectStore(STORES.CATEGORIES);
        const req = store.delete(categoryId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = (await this.getCategories()).filter(c => c.id !== categoryId);
      localStorage.setItem(`cosplaypos_${STORES.CATEGORIES}`, JSON.stringify(list));
      return true;
    }
  }

  async isCategoryInUse(categoryId: string): Promise<boolean> {
    const products = await this.getProducts();
    return products.some(p => p.categoryId === categoryId);
  }

  async checkCategoryNameUnique(name: string, excludeCategoryId?: string): Promise<boolean> {
    const categories = await this.getCategories();
    const cleanName = name.trim().toLowerCase();
    const existing = categories.find(
      c => c.name.trim().toLowerCase() === cleanName && c.id !== excludeCategoryId
    );
    return !existing;
  }

  // --- UNIFIED ATOMIC STOCK SERVICE (TAHAP 3) ---
  /**
   * Single source of truth for stock modification across POS, Stock In, and Adjustments.
   * Atomically reads, calculates, validates non-negative, updates Product, and logs StockMovement.
   */
  async updateProductStock(params: {
    productId: string;
    type: StockMovementType;
    quantity: number;
    reason: string;
    note?: string;
    referenceId?: string;
    createdBy: string;
  }): Promise<{ product: Product; movement: StockMovement }> {
    const db = await this.openDB();
    const { productId, type, quantity, reason, note, referenceId, createdBy } = params;

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Jumlah perubahan stok harus berupa bilangan bulat positif lebih dari 0.');
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PRODUCTS, STORES.STOCK_MOVEMENTS], 'readwrite');
      const prodStore = tx.objectStore(STORES.PRODUCTS);
      const movStore = tx.objectStore(STORES.STOCK_MOVEMENTS);

      const getReq = prodStore.get(productId);

      getReq.onsuccess = () => {
        const product = getReq.result as Product;
        if (!product) {
          reject(new Error(`Produk dengan ID "${productId}" tidak ditemukan.`));
          return;
        }

        const stockBefore = product.stock;
        let stockAfter = stockBefore;

        // Determine direction based on movement type
        const isIncrease =
          type === 'INITIAL' ||
          type === 'STOCK_IN' ||
          type === 'ADJUSTMENT_IN' ||
          type === 'OPNAME_IN';

        if (isIncrease) {
          stockAfter = stockBefore + quantity;
        } else {
          stockAfter = stockBefore - quantity;
        }

        // CRITICAL: Stock cannot become negative!
        if (stockAfter < 0) {
          reject(
            new Error(
              `Stok tidak mencukupi! Stok saat ini: ${stockBefore} pcs, pengurangan diminta: ${quantity} pcs.`
            )
          );
          return;
        }

        // 1. Update Product
        product.stock = stockAfter;
        product.updatedAt = new Date().toISOString();
        prodStore.put(product);

        // 2. Create StockMovement
        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId,
          type,
          quantity,
          stockBefore,
          stockAfter,
          reason,
          referenceId,
          note,
          createdAt: new Date().toISOString(),
          createdBy,
        };
        movStore.put(movement);

        tx.oncomplete = () => {
          resolve({ product, movement });
        };

        tx.onerror = () => {
          reject(tx.error);
        };
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  // Legacy updateStock helper mapped to unified service
  async updateStock(productId: string, quantityToDeduct: number, createdBy = 'Kasir POS'): Promise<number> {
    const res = await this.updateProductStock({
      productId,
      type: 'SALE',
      quantity: quantityToDeduct,
      reason: 'Penjualan Kasir',
      createdBy,
    });
    return res.product.stock;
  }

  // --- STOCK MOVEMENTS (TAHAP 3) ---
  async getStockMovements(productId?: string): Promise<StockMovement[]> {
    const list = await this.getAll<StockMovement>(STORES.STOCK_MOVEMENTS);
    const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (productId) {
      return sorted.filter(m => m.productId === productId);
    }
    return sorted;
  }

  async addStockMovement(movement: StockMovement): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.STOCK_MOVEMENTS, 'readwrite');
      const store = tx.objectStore(STORES.STOCK_MOVEMENTS);
      const req = store.put(movement);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- STOCK OPNAME SESSIONS (TAHAP 3) ---
  async getOpnameSessions(): Promise<StockOpnameSession[]> {
    const list = await this.getAll<StockOpnameSession>(STORES.OPNAME_SESSIONS);
    return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async saveOpnameSession(session: StockOpnameSession): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.OPNAME_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORES.OPNAME_SESSIONS);
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Apply a completed stock opname session atomically.
   * Updates products' stock to physical count, creates OPNAME_IN / OPNAME_OUT movements,
   * and saves the completed session in one atomic IndexedDB transaction.
   */
  async applyStockOpnameSession(
    session: StockOpnameSession,
    createdBy: string = 'Operator Booth'
  ): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        [STORES.OPNAME_SESSIONS, STORES.PRODUCTS, STORES.STOCK_MOVEMENTS],
        'readwrite'
      );
      const opStore = tx.objectStore(STORES.OPNAME_SESSIONS);
      const prodStore = tx.objectStore(STORES.PRODUCTS);
      const movStore = tx.objectStore(STORES.STOCK_MOVEMENTS);

      // 1. Save completed session
      session.status = 'COMPLETED';
      session.completedAt = new Date().toISOString();
      opStore.put(session);

      // 2. Process each item discrepancy
      for (const item of session.items) {
        if (item.difference === 0) continue;

        const getReq = prodStore.get(item.productId);
        getReq.onsuccess = () => {
          const product = getReq.result as Product;
          if (product) {
            const stockBefore = product.stock;
            const stockAfter = item.physicalStock;
            const diff = item.difference;
            const type: StockMovementType = diff > 0 ? 'OPNAME_IN' : 'OPNAME_OUT';
            const quantity = Math.abs(diff);

            product.stock = stockAfter;
            product.updatedAt = new Date().toISOString();
            prodStore.put(product);

            const movement: StockMovement = {
              id: `mov-opn-${session.opnameNumber}-${product.id}-${Date.now()}`,
              productId: product.id,
              type,
              quantity,
              stockBefore,
              stockAfter,
              reason: 'Penyesuaian Hasil Stock Opname',
              referenceId: session.opnameNumber,
              note: item.note || `Selisih opname fisik: ${diff > 0 ? '+' : ''}${diff} pcs`,
              createdAt: new Date().toISOString(),
              createdBy,
            };
            movStore.put(movement);
          }
        };
      }

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error);
      };
    });
  }

  // --- TRANSACTIONS (ATOMIC CHECKOUT WITH SALE MOVEMENTS) ---
  async getTransactions(): Promise<Transaction[]> {
    const list = await this.getAll<Transaction>(STORES.TRANSACTIONS);
    return list.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  /**
   * Atomic POS checkout: stores transaction, reduces stock, and writes SALE movements in ONE atomic transaction.
   */
  async createTransaction(txData: Transaction): Promise<Transaction> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.TRANSACTIONS, STORES.PRODUCTS, STORES.STOCK_MOVEMENTS], 'readwrite');
      const txStore = tx.objectStore(STORES.TRANSACTIONS);
      const prodStore = tx.objectStore(STORES.PRODUCTS);
      const movStore = tx.objectStore(STORES.STOCK_MOVEMENTS);

      // 1. Put transaction
      txStore.put(txData);

      // 2. Reduce stock & create SALE movements for each item atomically
      for (const item of txData.items) {
        const getReq = prodStore.get(item.productId);
        getReq.onsuccess = () => {
          const product = getReq.result as Product;
          if (product) {
            const stockBefore = product.stock;
            const stockAfter = Math.max(0, product.stock - item.quantity);

            product.stock = stockAfter;
            product.updatedAt = new Date().toISOString();
            prodStore.put(product);

            // Log SALE movement
            const movement: StockMovement = {
              id: `mov-sale-${txData.transactionNumber}-${item.productId}-${Date.now()}`,
              productId: item.productId,
              type: 'SALE',
              quantity: item.quantity,
              stockBefore,
              stockAfter,
              reason: 'Penjualan Kasir POS',
              referenceId: txData.transactionNumber,
              createdAt: txData.transactionDate,
              createdBy: txData.cashierName,
            };
            movStore.put(movement);
          }
        };
      }

      tx.oncomplete = () => {
        resolve(txData);
      };

      tx.onerror = () => {
        reject(tx.error);
      };
    });
  }

  // --- SETTINGS ---
  async getSettings(): Promise<BoothSettings | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.get('booth_config');
        req.onsuccess = () => {
          resolve(req.result ? req.result.value : null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      const saved = localStorage.getItem('cosplaypos_settings');
      return saved ? JSON.parse(saved) : null;
    }
  }

  async saveSettings(settings: BoothSettings): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.put({ key: 'booth_config', value: settings });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      localStorage.setItem('cosplaypos_settings', JSON.stringify(settings));
    }
  }

  // Generic key-value store access in settings (Tahap 5)
  async getSettingItem<T>(key: string): Promise<T | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.value : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async saveSettingItem(key: string, value: any): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.put({ key, value });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error('Failed to save setting item:', err);
    }
  }

  // Generic store retrieval (Tahap 5)
  async getAllFromStore<T = any>(storeName: string): Promise<T[]> {
    return await this.getAll<T>(storeName);
  }

  // --- SUPPLIERS (TAHAP 6) ---
  async getSuppliers(): Promise<Supplier[]> {
    const list = await this.getAll<Supplier>(STORES.SUPPLIERS);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async saveSupplier(supplier: Supplier): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SUPPLIERS, 'readwrite');
      const store = tx.objectStore(STORES.SUPPLIERS);
      const req = store.put(supplier);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteSupplier(supplierId: string): Promise<{ success: boolean; softDeleted?: boolean; error?: string }> {
    const inUse = await this.isSupplierInUse(supplierId);
    if (inUse) {
      // Soft-delete / deactivate (Bagian 4)
      const suppliers = await this.getSuppliers();
      const target = suppliers.find(s => s.id === supplierId);
      if (target) {
        target.status = 'INACTIVE';
        target.updatedAt = new Date().toISOString();
        await this.saveSupplier(target);
        return { success: true, softDeleted: true };
      }
      return { success: false, error: 'Supplier tidak ditemukan.' };
    }

    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SUPPLIERS, 'readwrite');
      const store = tx.objectStore(STORES.SUPPLIERS);
      const req = store.delete(supplierId);
      req.onsuccess = () => resolve({ success: true, softDeleted: false });
      req.onerror = () => reject(req.error);
    });
  }

  async isSupplierInUse(supplierId: string): Promise<boolean> {
    const pos = await this.getAll<PurchaseOrder>(STORES.PURCHASE_ORDERS);
    return pos.some(po => po.supplierId === supplierId);
  }

  async checkSupplierNameUnique(name: string, excludeSupplierId?: string): Promise<boolean> {
    const suppliers = await this.getSuppliers();
    const cleanName = name.trim().toLowerCase();
    const existing = suppliers.find(
      s => s.name.trim().toLowerCase() === cleanName && s.id !== excludeSupplierId
    );
    return !existing;
  }

  // --- PURCHASE ORDERS (TAHAP 6) ---
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const pos = await this.getAll<PurchaseOrder>(STORES.PURCHASE_ORDERS);
    const items = await this.getAll<PurchaseOrderItem>(STORES.PURCHASE_ORDER_ITEMS);
    
    const populated = pos.map(po => ({
      ...po,
      items: items.filter(i => i.purchaseOrderId === po.id),
    }));

    return populated.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORES.PURCHASE_ORDERS, STORES.PURCHASE_ORDER_ITEMS], 'readonly');
      const poStore = tx.objectStore(STORES.PURCHASE_ORDERS);
      const poiStore = tx.objectStore(STORES.PURCHASE_ORDER_ITEMS);

      const req = poStore.get(id);
      req.onsuccess = () => {
        const po = req.result as PurchaseOrder;
        if (!po) {
          resolve(null);
          return;
        }

        const idx = poiStore.index('purchaseOrderId');
        const itemsReq = idx.getAll(id);
        itemsReq.onsuccess = () => {
          po.items = itemsReq.result as PurchaseOrderItem[];
          resolve(po);
        };
        itemsReq.onerror = () => {
          po.items = [];
          resolve(po);
        };
      };
      req.onerror = () => resolve(null);
    });
  }

  async getPurchaseOrderItems(poId: string): Promise<PurchaseOrderItem[]> {
    const items = await this.getAll<PurchaseOrderItem>(STORES.PURCHASE_ORDER_ITEMS);
    return items.filter(i => i.purchaseOrderId === poId);
  }

  async savePurchaseOrder(po: PurchaseOrder, items: PurchaseOrderItem[]): Promise<PurchaseOrder> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PURCHASE_ORDERS, STORES.PURCHASE_ORDER_ITEMS], 'readwrite');
      const poStore = tx.objectStore(STORES.PURCHASE_ORDERS);
      const poiStore = tx.objectStore(STORES.PURCHASE_ORDER_ITEMS);

      // Save PO
      poStore.put(po);

      // Save all items
      for (const item of items) {
        poiStore.put(item);
      }

      tx.oncomplete = () => {
        po.items = items;
        resolve(po);
      };

      tx.onerror = () => {
        reject(tx.error);
      };
    });
  }

  async cancelPurchaseOrder(poId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PURCHASE_ORDERS, 'readwrite');
      const poStore = tx.objectStore(STORES.PURCHASE_ORDERS);

      const req = poStore.get(poId);
      req.onsuccess = () => {
        const po = req.result as PurchaseOrder;
        if (!po) {
          reject(new Error(`Purchase Order dengan ID "${poId}" tidak ditemukan.`));
          return;
        }

        if (po.status === 'RECEIVED') {
          reject(new Error(`Purchase Order ${po.poNumber} sudah berstatus RECEIVED penuh dan tidak dapat dibatalkan.`));
          return;
        }

        if (po.status === 'CANCELLED') {
          reject(new Error(`Purchase Order ${po.poNumber} sudah dibatalkan sebelumnya.`));
          return;
        }

        po.status = 'CANCELLED';
        po.updatedAt = new Date().toISOString();
        if (reason) {
          po.notes = po.notes ? `${po.notes} | Dibatalkan: ${reason}` : `Dibatalkan: ${reason}`;
        }
        poStore.put(po);
      };

      tx.oncomplete = () => resolve({ success: true });
      tx.onerror = () => reject(tx.error);
    });
  }

  async generatePoNumber(): Promise<string> {
    const pos = await this.getAll<PurchaseOrder>(STORES.PURCHASE_ORDERS);
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `PO-${dateStr}-`;
    const todayPos = pos.filter(p => p.poNumber.startsWith(prefix));
    const nextSeq = String(todayPos.length + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
  }

  // --- RECEIVING RECORDS (TAHAP 6) ---
  async getReceivingRecords(poId?: string): Promise<ReceivingRecord[]> {
    const list = await this.getAll<ReceivingRecord>(STORES.RECEIVING_RECORDS);
    const sorted = list.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
    if (poId) {
      return sorted.filter(r => r.purchaseOrderId === poId);
    }
    return sorted;
  }

  async generateReceivingNumber(): Promise<string> {
    const records = await this.getAll<ReceivingRecord>(STORES.RECEIVING_RECORDS);
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `RCV-${dateStr}-`;
    const todayRecords = records.filter(r => r.receivingNumber.startsWith(prefix));
    const nextSeq = String(todayRecords.length + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
  }

  /**
   * Atomic Receiving Operation:
   * 1. Updates Product.stock (stockBefore + qtyReceivedNow)
   * 2. Updates PurchaseOrderItem.qtyReceived
   * 3. Updates PurchaseOrder.status (RECEIVED or PARTIALLY_RECEIVED)
   * 4. Logs StockMovement (type: STOCK_IN, reason: PURCHASE_RECEIVING, referenceId: poNumber)
   * 5. Saves ReceivingRecord with snapshots
   */
  async executeReceiving(params: {
    poId: string;
    receivedBy: string;
    notes?: string;
    items: { productId: string; qtyReceivedNow: number; actualUnitCost?: number }[];
  }): Promise<{ success: boolean; receivingRecord?: ReceivingRecord; error?: string }> {
    const db = await this.openDB();
    const { poId, receivedBy, notes, items: receivedItemsInput } = params;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        [
          STORES.PURCHASE_ORDERS,
          STORES.PURCHASE_ORDER_ITEMS,
          STORES.PRODUCTS,
          STORES.STOCK_MOVEMENTS,
          STORES.RECEIVING_RECORDS,
        ],
        'readwrite'
      );

      const poStore = tx.objectStore(STORES.PURCHASE_ORDERS);
      const poiStore = tx.objectStore(STORES.PURCHASE_ORDER_ITEMS);
      const prodStore = tx.objectStore(STORES.PRODUCTS);
      const movStore = tx.objectStore(STORES.STOCK_MOVEMENTS);
      const recStore = tx.objectStore(STORES.RECEIVING_RECORDS);

      const getPoReq = poStore.get(poId);
      getPoReq.onsuccess = () => {
        const po = getPoReq.result as PurchaseOrder;
        if (!po) {
          reject(new Error(`Purchase Order dengan ID "${poId}" tidak ditemukan.`));
          return;
        }

        if (po.status === 'RECEIVED') {
          reject(new Error(`Purchase Order ${po.poNumber} sudah berstatus RECEIVED penuh.`));
          return;
        }

        if (po.status === 'CANCELLED') {
          reject(new Error(`Purchase Order ${po.poNumber} sudah dibatalkan.`));
          return;
        }

        const poiIndex = poiStore.index('purchaseOrderId');
        const getItemsReq = poiIndex.getAll(poId);

        getItemsReq.onsuccess = () => {
          const poItems = getItemsReq.result as PurchaseOrderItem[];
          if (poItems.length === 0) {
            reject(new Error(`Tidak ada item pada Purchase Order ${po.poNumber}.`));
            return;
          }

          const receivingRecordItems: ReceivingRecordItem[] = [];
          let totalReceivingQty = 0;
          let totalReceivingCost = 0;
          const nowIso = new Date().toISOString();

          // Process each item received
          for (const inputItem of receivedItemsInput) {
            if (inputItem.qtyReceivedNow <= 0) continue;

            const targetPoItem = poItems.find(item => item.productId === inputItem.productId);
            if (!targetPoItem) {
              reject(new Error(`Produk ID "${inputItem.productId}" bukan bagian dari PO ${po.poNumber}.`));
              return;
            }

            const remainingQty = targetPoItem.qtyOrdered - targetPoItem.qtyReceived;
            if (inputItem.qtyReceivedNow > remainingQty) {
              reject(
                new Error(
                  `Jumlah penerimaan (${inputItem.qtyReceivedNow}) melebihi sisa pesanan (${remainingQty}) untuk ${targetPoItem.productNameSnapshot}.`
                )
              );
              return;
            }

            // 1. Update PurchaseOrderItem qtyReceived
            targetPoItem.qtyReceived += inputItem.qtyReceivedNow;
            poiStore.put(targetPoItem);

            const costPriceToUse = inputItem.actualUnitCost ?? targetPoItem.unitCost;
            const itemSubtotal = inputItem.qtyReceivedNow * costPriceToUse;

            receivingRecordItems.push({
              productId: targetPoItem.productId,
              skuSnapshot: targetPoItem.skuSnapshot,
              productNameSnapshot: targetPoItem.productNameSnapshot,
              qtyReceivedNow: inputItem.qtyReceivedNow,
              actualUnitCost: costPriceToUse,
              subtotal: itemSubtotal,
            });

            totalReceivingQty += inputItem.qtyReceivedNow;
            totalReceivingCost += itemSubtotal;

            // 2. Read and Update Product stock
            const prodReq = prodStore.get(targetPoItem.productId);
            prodReq.onsuccess = () => {
              const product = prodReq.result as Product;
              if (product) {
                const stockBefore = product.stock;
                const stockAfter = stockBefore + inputItem.qtyReceivedNow;

                product.stock = stockAfter;
                if (inputItem.actualUnitCost && inputItem.actualUnitCost > 0) {
                  product.costPrice = inputItem.actualUnitCost;
                }
                product.updatedAt = nowIso;
                prodStore.put(product);

                // 3. Log STOCK_IN Movement
                const movement: StockMovement = {
                  id: `mov-rcv-${po.poNumber}-${product.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  productId: product.id,
                  type: 'STOCK_IN',
                  quantity: inputItem.qtyReceivedNow,
                  stockBefore,
                  stockAfter,
                  reason: 'PURCHASE_RECEIVING',
                  referenceId: po.poNumber,
                  referenceType: 'PURCHASE_ORDER',
                  note: `Penerimaan barang dari PO ${po.poNumber} (${inputItem.qtyReceivedNow} pcs @ Rp${costPriceToUse.toLocaleString('id-ID')})`,
                  createdAt: nowIso,
                  createdBy: receivedBy,
                };
                movStore.put(movement);
              }
            };
          }

          if (receivingRecordItems.length === 0) {
            reject(new Error('Tidak ada barang dengan kuantitas > 0 untuk diterima.'));
            return;
          }

          // 4. Update PO Status
          const allCompleted = poItems.every(item => item.qtyReceived >= item.qtyOrdered);
          po.status = allCompleted ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
          po.updatedAt = nowIso;
          poStore.put(po);

          // 5. Create ReceivingRecord
          const recNumber = `RCV-${nowIso.slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
          const receivingRecord: ReceivingRecord = {
            id: `rcv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            receivingNumber: recNumber,
            purchaseOrderId: po.id,
            poNumber: po.poNumber,
            supplierId: po.supplierId,
            supplierName: po.supplierNameSnapshot,
            receivedAt: nowIso,
            receivedBy,
            items: receivingRecordItems,
            totalQuantity: totalReceivingQty,
            totalCost: totalReceivingCost,
            notes,
            status: 'COMPLETED',
          };
          recStore.put(receivingRecord);

          tx.oncomplete = () => {
            resolve({ success: true, receivingRecord });
          };

          tx.onerror = () => {
            reject(tx.error);
          };
        };
        getItemsReq.onerror = () => reject(getItemsReq.error);
      };
      getPoReq.onerror = () => reject(getPoReq.error);
    });
  }

  // Get record counts for all stores (Tahap 5 & 6)
  async getRecordCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    const storeList = [
      STORES.PRODUCTS,
      STORES.CATEGORIES,
      STORES.TRANSACTIONS,
      STORES.STOCK_MOVEMENTS,
      STORES.OPNAME_SESSIONS,
      STORES.SETTINGS,
      STORES.SUPPLIERS,
      STORES.PURCHASE_ORDERS,
      STORES.PURCHASE_ORDER_ITEMS,
      STORES.RECEIVING_RECORDS,
    ];

    for (const name of storeList) {
      const items = await this.getAll(name);
      counts[name] = items.length;
    }
    return counts;
  }

  // Atomic Clear and Replace all stores for Backup Restore (Tahap 5 & 6)
  async clearAndReplaceAllStores(storesData: Record<string, any[]>): Promise<void> {
    const db = await this.openDB();
    const allStoreNames = [
      STORES.PRODUCTS,
      STORES.CATEGORIES,
      STORES.TRANSACTIONS,
      STORES.STOCK_MOVEMENTS,
      STORES.OPNAME_SESSIONS,
      STORES.SETTINGS,
      STORES.SUPPLIERS,
      STORES.PURCHASE_ORDERS,
      STORES.PURCHASE_ORDER_ITEMS,
      STORES.RECEIVING_RECORDS,
    ];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(allStoreNames, 'readwrite');

      // Clear all stores first
      for (const name of allStoreNames) {
        tx.objectStore(name).clear();
      }

      // Populate records
      for (const [storeName, records] of Object.entries(storesData)) {
        if (allStoreNames.includes(storeName) && Array.isArray(records)) {
          const store = tx.objectStore(storeName);
          for (const item of records) {
            store.put(item);
          }
        }
      }

      // Keep initialized marker in settings store
      const settingsStore = tx.objectStore(STORES.SETTINGS);
      settingsStore.put({ key: 'is_initialized', value: true });
      settingsStore.put({ key: 'is_initialized_tahap6', value: true });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));
    });
  }

  // Reset database completely (Tahap 5 Danger Zone)
  async resetDatabase(): Promise<void> {
    const db = await this.openDB();
    const allStoreNames = [
      STORES.PRODUCTS,
      STORES.CATEGORIES,
      STORES.TRANSACTIONS,
      STORES.STOCK_MOVEMENTS,
      STORES.OPNAME_SESSIONS,
      STORES.SETTINGS,
      STORES.SUPPLIERS,
      STORES.PURCHASE_ORDERS,
      STORES.PURCHASE_ORDER_ITEMS,
      STORES.RECEIVING_RECORDS,
    ];

    return new Promise((resolve, reject) => {
      const tx = db.transaction(allStoreNames, 'readwrite');
      for (const name of allStoreNames) {
        tx.objectStore(name).clear();
      }

      // Preserve clean booth config & initialized flag so terminal is operational
      const settingsStore = tx.objectStore(STORES.SETTINGS);
      settingsStore.put({ key: 'is_initialized', value: true });
      settingsStore.put({ key: 'is_initialized_tahap6', value: true });
      settingsStore.put({ key: 'booth_config', value: INITIAL_BOOTH_SETTINGS });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Reset transaction aborted'));
    });
  }
}

export const offlineDB = new OfflineDB();
