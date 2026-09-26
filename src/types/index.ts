export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  minimumStock: number;
  image?: string;
  description?: string;
  locationNote?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  sku?: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
}

export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type TransactionStatus = 'success' | 'refunded' | 'cancelled';

export interface Transaction {
  id: string;
  transactionNumber: string;
  transactionDate: string;
  subtotal: number;
  discount: number;
  discountCode?: string;
  total: number;
  paymentAmount: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  status: TransactionStatus;
  notes?: string;
  items: TransactionItem[];
  terminalId?: string;
  synced?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface BoothSettings {
  boothName: string;
  eventName: string;
  hallLocation: string;
  cashierName: string;
  cashierId: string;
  terminalId: string;
  socialHandle: string;
  receiptNote: string;
  printerName: string;
  autoPrintReceipt: boolean;
  currency: string;
  qrisMerchantName?: string;
  qrisNmid?: string;
  qrisTerminalCode?: string;
  qrisImageUrl?: string;
}

export type NavigationPage = 
  | 'pos' 
  | 'dashboard' 
  | 'transactions' 
  | 'products' 
  | 'inventory' 
  | 'reports' 
  | 'settings';

export type StockMovementType = 
  | 'INITIAL'
  | 'STOCK_IN'
  | 'SALE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'DAMAGE'
  | 'LOST'
  | 'OPNAME_IN'
  | 'OPNAME_OUT';

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceId?: string;
  referenceType?: string; // Tahap 6: e.g. 'PURCHASE_ORDER'
  note?: string;
  createdAt: string;
  createdBy: string;
}

export type OpnameStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface StockOpnameItem {
  id: string;
  sessionId: string;
  productId: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  note?: string;
}

export interface StockOpnameSession {
  id: string;
  opnameNumber: string;
  startedAt: string;
  completedAt?: string;
  status: OpnameStatus;
  totalItems: number;
  totalDifference: number;
  note?: string;
  createdBy: string;
  items: StockOpnameItem[];
}

// --- TAHAP 6: SUPPLIER, PURCHASING & RECEIVING ---

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus = 
  | 'DRAFT' 
  | 'ORDERED' 
  | 'PARTIALLY_RECEIVED' 
  | 'RECEIVED' 
  | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitCost: number; // Snapshot of cost price at PO creation
  subtotal: number; // qtyOrdered * unitCost
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-20260927-001
  supplierId: string;
  supplierNameSnapshot: string;
  orderDate: string; // ISO
  expectedDate?: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceivingRecordItem {
  productId: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  qtyReceivedNow: number;
  actualUnitCost: number;
  subtotal: number;
}

export interface ReceivingRecord {
  id: string;
  receivingNumber: string; // e.g. RCV-20260927-001
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  receivedAt: string; // ISO
  receivedBy: string; // Cashier or Operator name
  items: ReceivingRecordItem[];
  totalQuantity: number;
  totalCost: number;
  notes?: string;
  status: 'COMPLETED';
}

// --- BACKUP & RESTORE (TAHAP 5 & 6) ---

export interface BackupMetadata {
  app: string;
  appName: string;
  backupVersion: number;
  databaseVersion: number;
  createdAt: string;
  exportedStores: string[];
  recordCounts: Record<string, number>;
  checksum?: string;
}

export interface BackupData {
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  stock_movements: StockMovement[];
  opname_sessions: StockOpnameSession[];
  suppliers?: Supplier[];
  purchase_orders?: PurchaseOrder[];
  purchase_order_items?: PurchaseOrderItem[];
  receiving_records?: ReceivingRecord[];
  settings?: any[];
  [storeName: string]: any;
}

export interface BackupFile extends BackupMetadata {
  data: BackupData;
}

export interface LastBackupInfo {
  timestamp: string;
  status: 'success' | 'failed';
  filename: string;
  sizeBytes: number;
  recordCount: number;
}


