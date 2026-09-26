import type { 
  BackupFile, 
  LastBackupInfo, 
  Product, 
  Category, 
  Transaction, 
  StockMovement, 
  StockOpnameSession,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  ReceivingRecord
} from '../types';
import { offlineDB, STORES, DB_VERSION } from '../db/indexedDB';

export const APP_ID = 'CosplayPOS';
export const APP_NAME = 'CosplayPOS • Offline-First Event Terminal';
export const BACKUP_VERSION = 1;
export const CURRENT_DB_VERSION = DB_VERSION;

/**
 * Generate a local timestamp string for filenames: YYYY-MM-DD-HHmmss
 */
export function getLocalTimestamp(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format ISO date string into Indonesian readable format: DD MMMM YYYY, HH:mm WIB
 */
export function formatBackupDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes} WIB`;
  } catch {
    return isoString;
  }
}

/**
 * Calculate SHA-256 checksum of data using browser Web Crypto API
 */
export async function calculateChecksum(data: unknown): Promise<string> {
  try {
    const jsonStr = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return 'offline-checksum-unsupported';
  }
}

export class BackupService {
  /**
   * Reads all stores from IndexedDB and composes a complete BackupFile
   */
  async createBackup(): Promise<BackupFile> {
    const [
      products, 
      categories, 
      transactions, 
      stockMovements, 
      opnameSessions, 
      settings,
      suppliers,
      purchaseOrders,
      purchaseOrderItems,
      receivingRecords
    ] = await Promise.all([
      offlineDB.getAllFromStore<Product>(STORES.PRODUCTS),
      offlineDB.getAllFromStore<Category>(STORES.CATEGORIES),
      offlineDB.getAllFromStore<Transaction>(STORES.TRANSACTIONS),
      offlineDB.getAllFromStore<StockMovement>(STORES.STOCK_MOVEMENTS),
      offlineDB.getAllFromStore<StockOpnameSession>(STORES.OPNAME_SESSIONS),
      offlineDB.getAllFromStore(STORES.SETTINGS),
      offlineDB.getAllFromStore<Supplier>(STORES.SUPPLIERS),
      offlineDB.getAllFromStore<PurchaseOrder>(STORES.PURCHASE_ORDERS),
      offlineDB.getAllFromStore<PurchaseOrderItem>(STORES.PURCHASE_ORDER_ITEMS),
      offlineDB.getAllFromStore<ReceivingRecord>(STORES.RECEIVING_RECORDS),
    ]);

    const data = {
      products,
      categories,
      transactions,
      stock_movements: stockMovements,
      opname_sessions: opnameSessions,
      settings,
      suppliers,
      purchase_orders: purchaseOrders,
      purchase_order_items: purchaseOrderItems,
      receiving_records: receivingRecords,
    };

    const recordCounts: Record<string, number> = {
      products: products.length,
      categories: categories.length,
      transactions: transactions.length,
      stock_movements: stockMovements.length,
      opname_sessions: opnameSessions.length,
      settings: settings.length,
      suppliers: suppliers.length,
      purchase_orders: purchaseOrders.length,
      purchase_order_items: purchaseOrderItems.length,
      receiving_records: receivingRecords.length,
    };

    const checksum = await calculateChecksum(data);

    const backupFile: BackupFile = {
      app: APP_ID,
      appName: APP_NAME,
      backupVersion: BACKUP_VERSION,
      databaseVersion: CURRENT_DB_VERSION,
      createdAt: new Date().toISOString(),
      exportedStores: [
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
      ],
      recordCounts,
      checksum,
      data,
    };

    return backupFile;
  }

  /**
   * Generates a downloadable JSON file and triggers client download
   */
  async downloadBackup(
    backup: BackupFile,
    prefix: 'Backup' | 'PreRestore' = 'Backup'
  ): Promise<{ filename: string; sizeBytes: number }> {
    const timestamp = getLocalTimestamp();
    const filename = `CosplayPOS-${prefix}-${timestamp}.json`;
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const sizeBytes = blob.size;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Save last backup metadata if this is a manual or primary backup
    if (prefix === 'Backup') {
      const totalRecords = Object.values(backup.recordCounts).reduce((a, b) => a + b, 0);
      await this.saveLastBackupInfo({
        timestamp: backup.createdAt,
        status: 'success',
        filename,
        sizeBytes,
        recordCount: totalRecords,
      });
    }

    return { filename, sizeBytes };
  }

  /**
   * Validates a parsed backup object according to Bagian 10 & 14
   */
  validateBackup(backupObj: any): { valid: boolean; error?: string; backup?: BackupFile } {
    if (!backupObj || typeof backupObj !== 'object') {
      return { valid: false, error: 'File backup tidak valid atau rusak.' };
    }

    // Check app identifier
    if (backupObj.app !== APP_ID && !backupObj.appName?.includes('CosplayPOS')) {
      return {
        valid: false,
        error: 'File backup tidak valid atau rusak: Application identifier tidak sesuai untuk CosplayPOS.',
      };
    }

    // Check database version compatibility (Bagian 14)
    if (typeof backupObj.databaseVersion !== 'number') {
      return { valid: false, error: 'File backup tidak valid atau rusak: Versi database tidak ditemukan.' };
    }

    if (backupObj.databaseVersion > CURRENT_DB_VERSION) {
      return {
        valid: false,
        error: `Backup berasal dari versi database yang lebih baru (v${backupObj.databaseVersion}) dan tidak kompatibel dengan aplikasi ini (v${CURRENT_DB_VERSION}).`,
      };
    }

    // Check data object
    if (!backupObj.data || typeof backupObj.data !== 'object') {
      return { valid: false, error: 'File backup tidak valid atau rusak: Konten data tidak ditemukan.' };
    }

    // Check required stores exist as arrays
    const { products, categories, transactions } = backupObj.data;
    if (!Array.isArray(products) || !Array.isArray(categories) || !Array.isArray(transactions)) {
      return {
        valid: false,
        error: 'File backup tidak valid atau rusak: Struktur tabel utama tidak lengkap.',
      };
    }

    // Check records structure for consistency
    const invalidProduct = products.some(
      (p: any) => !p || typeof p.id !== 'string' || typeof p.name !== 'string'
    );
    if (invalidProduct) {
      return {
        valid: false,
        error: 'File backup tidak valid atau rusak: Terdapat record produk yang tidak memiliki struktur valid.',
      };
    }

    const invalidCategory = categories.some(
      (c: any) => !c || typeof c.id !== 'string' || typeof c.name !== 'string'
    );
    if (invalidCategory) {
      return {
        valid: false,
        error: 'File backup tidak valid atau rusak: Terdapat record kategori yang tidak valid.',
      };
    }

    const invalidTransaction = transactions.some(
      (t: any) => !t || typeof t.id !== 'string' || typeof t.transactionNumber !== 'string'
    );
    if (invalidTransaction) {
      return {
        valid: false,
        error: 'File backup tidak valid atau rusak: Terdapat record transaksi yang tidak valid.',
      };
    }

    return { valid: true, backup: backupObj as BackupFile };
  }

  /**
   * Inspects a File object from user input
   */
  async inspectBackup(file: File): Promise<{
    valid: boolean;
    error?: string;
    backup?: BackupFile;
    fileSizeBytes: number;
  }> {
    const fileSizeBytes = file.size;

    try {
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        return {
          valid: false,
          error: 'File backup tidak valid atau rusak.',
          fileSizeBytes,
        };
      }

      const validation = this.validateBackup(parsed);
      if (!validation.valid) {
        return {
          valid: false,
          error: validation.error,
          fileSizeBytes,
        };
      }

      return {
        valid: true,
        backup: validation.backup,
        fileSizeBytes,
      };
    } catch {
      return {
        valid: false,
        error: 'Gagal membaca file dari disk.',
        fileSizeBytes,
      };
    }
  }

  /**
   * Executes atomic restore with automatic pre-restore backup and integrity check
   */
  async restoreBackup(
    backup: BackupFile,
    options: { skipPreRestore?: boolean } = {}
  ): Promise<{
    success: boolean;
    error?: string;
    integrityCheck?: Record<string, number>;
    preRestoreFilename?: string;
  }> {
    let preRestoreFilename: string | undefined;

    try {
      // 1. Mandatory Pre-Restore Backup (Bagian 12)
      if (!options.skipPreRestore) {
        const currentBackup = await this.createBackup();
        const preResult = await this.downloadBackup(currentBackup, 'PreRestore');
        preRestoreFilename = preResult.filename;
      }

      // 2. Prepare data for all stores (with backward compatibility)
      const storesData: Record<string, any[]> = {
        [STORES.PRODUCTS]: backup.data.products || [],
        [STORES.CATEGORIES]: backup.data.categories || [],
        [STORES.TRANSACTIONS]: backup.data.transactions || [],
        [STORES.STOCK_MOVEMENTS]: backup.data.stock_movements || [],
        [STORES.OPNAME_SESSIONS]: backup.data.opname_sessions || [],
        [STORES.SETTINGS]: backup.data.settings || [],
        [STORES.SUPPLIERS]: backup.data.suppliers || [],
        [STORES.PURCHASE_ORDERS]: backup.data.purchase_orders || [],
        [STORES.PURCHASE_ORDER_ITEMS]: backup.data.purchase_order_items || [],
        [STORES.RECEIVING_RECORDS]: backup.data.receiving_records || [],
      };

      // 3. Atomic replacement into IndexedDB (Bagian 13)
      await offlineDB.clearAndReplaceAllStores(storesData);

      // 4. Data Integrity Check (Bagian 15)
      const actualCounts = await offlineDB.getRecordCounts();
      const expectedProducts = backup.data.products?.length || 0;
      const expectedCategories = backup.data.categories?.length || 0;
      const expectedTransactions = backup.data.transactions?.length || 0;
      const expectedMovements = backup.data.stock_movements?.length || 0;
      const expectedOpnames = backup.data.opname_sessions?.length || 0;
      const expectedSuppliers = backup.data.suppliers?.length || 0;
      const expectedPOs = backup.data.purchase_orders?.length || 0;
      const expectedPOItems = backup.data.purchase_order_items?.length || 0;
      const expectedReceiving = backup.data.receiving_records?.length || 0;

      if (
        actualCounts[STORES.PRODUCTS] !== expectedProducts ||
        actualCounts[STORES.CATEGORIES] !== expectedCategories ||
        actualCounts[STORES.TRANSACTIONS] !== expectedTransactions ||
        actualCounts[STORES.STOCK_MOVEMENTS] !== expectedMovements ||
        actualCounts[STORES.OPNAME_SESSIONS] !== expectedOpnames ||
        (backup.data.suppliers !== undefined && actualCounts[STORES.SUPPLIERS] !== expectedSuppliers) ||
        (backup.data.purchase_orders !== undefined && actualCounts[STORES.PURCHASE_ORDERS] !== expectedPOs) ||
        (backup.data.purchase_order_items !== undefined && actualCounts[STORES.PURCHASE_ORDER_ITEMS] !== expectedPOItems) ||
        (backup.data.receiving_records !== undefined && actualCounts[STORES.RECEIVING_RECORDS] !== expectedReceiving)
      ) {
        return {
          success: false,
          error: 'Peringatan integritas: Jumlah data yang dipulihkan tidak sesuai dengan metadata file cadangan.',
          integrityCheck: actualCounts,
          preRestoreFilename,
        };
      }

      return {
        success: true,
        integrityCheck: actualCounts,
        preRestoreFilename,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Proses restore gagal: ${err?.message || 'Kesalahan sistem IndexedDB'}`,
        preRestoreFilename,
      };
    }
  }

  /**
   * Resets database completely (Danger Zone)
   */
  async resetDatabase(): Promise<void> {
    await offlineDB.resetDatabase();
  }

  /**
   * Fetches database health status and record counts for Settings card
   */
  async getDatabaseStats(): Promise<{
    status: 'Healthy' | 'Warning';
    version: number;
    counts: Record<string, number>;
    estimatedSizeBytes: number;
  }> {
    try {
      const counts = await offlineDB.getRecordCounts();
      // Estimate size by serializing all records
      const [
        products, 
        categories, 
        transactions, 
        stockMovements, 
        opnameSessions, 
        settings,
        suppliers,
        purchaseOrders,
        purchaseOrderItems,
        receivingRecords
      ] = await Promise.all([
        offlineDB.getAllFromStore<Product>(STORES.PRODUCTS),
        offlineDB.getAllFromStore<Category>(STORES.CATEGORIES),
        offlineDB.getAllFromStore<Transaction>(STORES.TRANSACTIONS),
        offlineDB.getAllFromStore<StockMovement>(STORES.STOCK_MOVEMENTS),
        offlineDB.getAllFromStore<StockOpnameSession>(STORES.OPNAME_SESSIONS),
        offlineDB.getAllFromStore(STORES.SETTINGS),
        offlineDB.getAllFromStore<Supplier>(STORES.SUPPLIERS),
        offlineDB.getAllFromStore<PurchaseOrder>(STORES.PURCHASE_ORDERS),
        offlineDB.getAllFromStore<PurchaseOrderItem>(STORES.PURCHASE_ORDER_ITEMS),
        offlineDB.getAllFromStore<ReceivingRecord>(STORES.RECEIVING_RECORDS),
      ]);

      const totalJson = JSON.stringify({
        products,
        categories,
        transactions,
        stockMovements,
        opnameSessions,
        settings,
        suppliers,
        purchaseOrders,
        purchaseOrderItems,
        receivingRecords,
      });

      const estimatedSizeBytes = new Blob([totalJson]).size;

      return {
        status: 'Healthy',
        version: CURRENT_DB_VERSION,
        counts,
        estimatedSizeBytes,
      };
    } catch {
      return {
        status: 'Warning',
        version: CURRENT_DB_VERSION,
        counts: {},
        estimatedSizeBytes: 0,
      };
    }
  }

  /**
   * Get metadata of last completed backup from IndexedDB
   */
  async getLastBackupInfo(): Promise<LastBackupInfo | null> {
    return await offlineDB.getSettingItem<LastBackupInfo>('last_backup_meta');
  }

  /**
   * Save metadata of last completed backup to IndexedDB
   */
  async saveLastBackupInfo(info: LastBackupInfo): Promise<void> {
    await offlineDB.saveSettingItem('last_backup_meta', info);
  }
}

export const backupService = new BackupService();
