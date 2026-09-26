import type { Transaction, Product, Category, StockMovement } from '../types';
import { formatDateTime } from '../utils/formatters';

export type DateRangePreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'all' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Get date string YYYY-MM-DD in local application timezone
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Resolve start and end dates from a preset in local timezone
 */
export const resolveDateRange = (preset: DateRangePreset, customStart?: string, customEnd?: string): DateRange => {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  if (preset === 'today') {
    return { preset, startDate: todayStr, endDate: todayStr };
  }

  if (preset === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = getLocalDateString(y);
    return { preset, startDate: yStr, endDate: yStr };
  }

  if (preset === 'last7') {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { preset, startDate: getLocalDateString(s), endDate: todayStr };
  }

  if (preset === 'last30') {
    const s = new Date(now);
    s.setDate(s.getDate() - 29);
    return { preset, startDate: getLocalDateString(s), endDate: todayStr };
  }

  if (preset === 'thisMonth') {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { preset, startDate: getLocalDateString(s), endDate: todayStr };
  }

  if (preset === 'custom' && customStart && customEnd) {
    return { preset, startDate: customStart, endDate: customEnd };
  }

  // Default / 'all'
  return { preset: 'all', startDate: '2020-01-01', endDate: '2030-12-31' };
};

/**
 * Check if a transaction ISO date string falls into the given date range (inclusive, local date)
 */
export const isDateInRange = (isoDateStr: string, range: DateRange): boolean => {
  if (range.preset === 'all') return true;
  const txDate = new Date(isoDateStr);
  const txLocalDate = getLocalDateString(txDate);
  return txLocalDate >= range.startDate && txLocalDate <= range.endDate;
};

/**
 * Check whether a transaction is considered completed and valid for sales
 */
export const isCompletedTransaction = (tx: Transaction): boolean => {
  return tx.status === 'success' || (tx.status as string) === 'completed';
};

export interface SalesSummary {
  totalTransactions: number;
  grossSales: number;
  totalDiscount: number;
  netSales: number;
  averageTransaction: number;
  totalItemsSold: number;
  discountedTransactionsCount: number;
  averageDiscount: number;
}

/**
 * Compute sales summary metrics
 * Formula:
 * Gross Sales = sum of subtotal before discount
 * Discount = total discount
 * Net Sales = Gross Sales - Discount
 * Average Transaction = Net Sales / completed transactions
 */
export const getSalesSummary = (transactions: Transaction[]): SalesSummary => {
  const completed = transactions.filter(isCompletedTransaction);
  const totalTransactions = completed.length;

  const grossSales = completed.reduce((sum, tx) => sum + (tx.subtotal || tx.total), 0);
  const totalDiscount = completed.reduce((sum, tx) => sum + (tx.discount || 0), 0);
  const netSales = Math.max(0, grossSales - totalDiscount);

  const averageTransaction = totalTransactions > 0 ? Math.round(netSales / totalTransactions) : 0;

  const totalItemsSold = completed.reduce(
    (sum, tx) => sum + tx.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  const discountedTransactions = completed.filter(tx => (tx.discount || 0) > 0);
  const discountedTransactionsCount = discountedTransactions.length;
  const averageDiscount =
    discountedTransactionsCount > 0 ? Math.round(totalDiscount / discountedTransactionsCount) : 0;

  return {
    totalTransactions,
    grossSales,
    totalDiscount,
    netSales,
    averageTransaction,
    totalItemsSold,
    discountedTransactionsCount,
    averageDiscount,
  };
};

export interface HourlySalesPoint {
  hour: number;
  hourLabel: string;
  sales: number;
  transactionCount: number;
  itemsCount: number;
}

/**
 * Group completed transactions by hour (09:00 - 21:00)
 */
export const getHourlySales = (transactions: Transaction[]): HourlySalesPoint[] => {
  const completed = transactions.filter(isCompletedTransaction);
  const hourMap: Record<number, { sales: number; count: number; items: number }> = {};

  // Standard hours for convention booth: 09:00 to 20:00
  for (let h = 9; h <= 20; h++) {
    hourMap[h] = { sales: 0, count: 0, items: 0 };
  }

  for (const tx of completed) {
    const d = new Date(tx.transactionDate);
    const h = d.getHours();
    if (!hourMap[h]) {
      hourMap[h] = { sales: 0, count: 0, items: 0 };
    }
    hourMap[h].sales += tx.total;
    hourMap[h].count += 1;
    hourMap[h].items += tx.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  const hours = Object.keys(hourMap).map(Number).sort((a, b) => a - b);

  return hours.map(h => ({
    hour: h,
    hourLabel: `${String(h).padStart(2, '0')}:00`,
    sales: hourMap[h].sales,
    transactionCount: hourMap[h].count,
    itemsCount: hourMap[h].items,
  }));
};

export interface DailySalesPoint {
  date: string;
  dateLabel: string;
  sales: number;
  transactionCount: number;
  itemsCount: number;
}

/**
 * Group completed transactions by day
 */
export const getDailySales = (transactions: Transaction[], dateRange: DateRange): DailySalesPoint[] => {
  const completed = transactions.filter(isCompletedTransaction);
  const dateMap: Record<string, { sales: number; count: number; items: number }> = {};

  // Initialize range dates
  const start = new Date(dateRange.startDate + 'T00:00:00');
  const end = new Date(dateRange.endDate + 'T00:00:00');
  const cur = new Date(start);

  while (cur <= end) {
    const dStr = getLocalDateString(cur);
    dateMap[dStr] = { sales: 0, count: 0, items: 0 };
    cur.setDate(cur.getDate() + 1);
  }

  for (const tx of completed) {
    const dStr = getLocalDateString(new Date(tx.transactionDate));
    if (dateMap[dStr]) {
      dateMap[dStr].sales += tx.total;
      dateMap[dStr].count += 1;
      dateMap[dStr].items += tx.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  }

  return Object.keys(dateMap).sort().map(dStr => {
    const [, m, d] = dStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const label = `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
    return {
      date: dStr,
      dateLabel: label,
      sales: dateMap[dStr].sales,
      transactionCount: dateMap[dStr].count,
      itemsCount: dateMap[dStr].items,
    };
  });
};

export interface TopProductItem {
  rank: number;
  productId: string;
  sku: string;
  name: string;
  image?: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
}

/**
 * Rank products by quantity sold (completed transactions only)
 * Always uses snapshot price from transaction items for historical accuracy.
 */
export const getTopProducts = (
  transactions: Transaction[],
  products: Product[],
  limit: number = 5
): TopProductItem[] => {
  const completed = transactions.filter(isCompletedTransaction);
  const itemMap: Record<string, { sku: string; name: string; image?: string; qty: number; revenue: number }> = {};

  for (const tx of completed) {
    for (const item of tx.items) {
      if (!itemMap[item.productId]) {
        const prod = products.find(p => p.id === item.productId);
        itemMap[item.productId] = {
          sku: item.sku || prod?.sku || '-',
          name: item.productName || prod?.name || 'Produk',
          image: item.image || prod?.image,
          qty: 0,
          revenue: 0,
        };
      }
      itemMap[item.productId].qty += item.quantity;
      itemMap[item.productId].revenue += item.subtotal;
    }
  }

  const sorted = Object.keys(itemMap)
    .map(pId => ({
      productId: pId,
      sku: itemMap[pId].sku,
      name: itemMap[pId].name,
      image: itemMap[pId].image,
      quantitySold: itemMap[pId].qty,
      revenue: itemMap[pId].revenue,
      averagePrice: itemMap[pId].qty > 0 ? Math.round(itemMap[pId].revenue / itemMap[pId].qty) : 0,
    }))
    .sort((a, b) => {
      if (b.quantitySold !== a.quantitySold) {
        return b.quantitySold - a.quantitySold;
      }
      return b.revenue - a.revenue;
    });

  return sorted.slice(0, limit).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
};

export interface PaymentDistributionItem {
  method: 'cash' | 'qris' | 'transfer';
  label: string;
  total: number;
  count: number;
  percentage: number;
}

/**
 * Calculate payment method distribution (completed transactions only)
 */
export const getPaymentDistribution = (transactions: Transaction[]): PaymentDistributionItem[] => {
  const completed = transactions.filter(isCompletedTransaction);
  const dist = {
    cash: { total: 0, count: 0 },
    qris: { total: 0, count: 0 },
    transfer: { total: 0, count: 0 },
  };

  for (const tx of completed) {
    const m = tx.paymentMethod as 'cash' | 'qris' | 'transfer';
    if (dist[m]) {
      dist[m].total += tx.total;
      dist[m].count += 1;
    }
  }

  const grandTotal = dist.cash.total + dist.qris.total + dist.transfer.total;

  const getPct = (val: number) => (grandTotal > 0 ? Math.round((val / grandTotal) * 100) : 0);

  return [
    {
      method: 'cash',
      label: 'Tunai (Cash)',
      total: dist.cash.total,
      count: dist.cash.count,
      percentage: getPct(dist.cash.total),
    },
    {
      method: 'qris',
      label: 'QRIS Statis',
      total: dist.qris.total,
      count: dist.qris.count,
      percentage: getPct(dist.qris.total),
    },
    {
      method: 'transfer',
      label: 'Transfer Bank',
      total: dist.transfer.total,
      count: dist.transfer.count,
      percentage: getPct(dist.transfer.total),
    },
  ];
};

export interface CategorySalesItem {
  categoryId: string;
  categoryName: string;
  itemsSold: number;
  revenue: number;
  percentage: number;
}

/**
 * Calculate sales grouped by category
 */
export const getCategorySales = (
  transactions: Transaction[],
  products: Product[],
  categories: Category[]
): CategorySalesItem[] => {
  const completed = transactions.filter(isCompletedTransaction);
  const prodCatMap = new Map<string, string>();
  for (const p of products) {
    prodCatMap.set(p.id, p.categoryId);
  }

  const catNameMap = new Map<string, string>();
  for (const c of categories) {
    catNameMap.set(c.id, c.name);
  }

  const catAgg: Record<string, { itemsSold: number; revenue: number }> = {};

  for (const tx of completed) {
    for (const item of tx.items) {
      const catId = prodCatMap.get(item.productId) || 'uncategorized';
      if (!catAgg[catId]) {
        catAgg[catId] = { itemsSold: 0, revenue: 0 };
      }
      catAgg[catId].itemsSold += item.quantity;
      catAgg[catId].revenue += item.subtotal;
    }
  }

  const grandRevenue = Object.values(catAgg).reduce((sum, c) => sum + c.revenue, 0);

  return Object.keys(catAgg)
    .map(catId => {
      const revenue = catAgg[catId].revenue;
      const pct = grandRevenue > 0 ? Math.round((revenue / grandRevenue) * 100) : 0;
      return {
        categoryId: catId,
        categoryName: catNameMap.get(catId) || 'Lainnya / Umum',
        itemsSold: catAgg[catId].itemsSold,
        revenue,
        percentage: isNaN(pct) ? 0 : pct,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
};

export interface ProductPerformanceItem {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  averagePrice: number;
  currentStock: number;
  minimumStock: number;
  stockStatus: 'READY' | 'LOW STOCK' | 'OUT OF STOCK';
}

/**
 * Calculate product performance overview for all products
 */
export const getProductPerformance = (
  transactions: Transaction[],
  products: Product[],
  categories: Category[]
): ProductPerformanceItem[] => {
  const completed = transactions.filter(isCompletedTransaction);
  const salesMap: Record<string, { qty: number; revenue: number }> = {};

  for (const tx of completed) {
    for (const item of tx.items) {
      if (!salesMap[item.productId]) {
        salesMap[item.productId] = { qty: 0, revenue: 0 };
      }
      salesMap[item.productId].qty += item.quantity;
      salesMap[item.productId].revenue += item.subtotal;
    }
  }

  const catMap = new Map<string, string>();
  for (const c of categories) {
    catMap.set(c.id, c.name);
  }

  return products.map(p => {
    const s = salesMap[p.id] || { qty: 0, revenue: 0 };
    let stockStatus: 'READY' | 'LOW STOCK' | 'OUT OF STOCK' = 'READY';
    if (p.stock === 0) {
      stockStatus = 'OUT OF STOCK';
    } else if (p.stock <= p.minimumStock) {
      stockStatus = 'LOW STOCK';
    }

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      categoryName: catMap.get(p.categoryId) || '-',
      unitsSold: s.qty,
      revenue: s.revenue,
      averagePrice: s.qty > 0 ? Math.round(s.revenue / s.qty) : p.price,
      currentStock: p.stock,
      minimumStock: p.minimumStock,
      stockStatus,
    };
  });
};

/**
 * Export data to standard UTF-8 CSV download
 */
export const exportDataToCSV = (
  type: 'transactions' | 'sales_report' | 'product_sales' | 'stock_movements',
  data: any[],
  dateRangeStr: string = getLocalDateString()
): void => {
  let headers: string[] = [];
  let rows: string[][] = [];
  let filename = `cosplaypos-${type}-${dateRangeStr}.csv`;

  if (type === 'transactions') {
    headers = [
      'No Invoice',
      'Tanggal Waktu',
      'Kasir',
      'Metode Pembayaran',
      'Total Item',
      'Subtotal',
      'Diskon',
      'Total Akhir',
      'Status',
      'Rincian Produk',
      'Catatan',
    ];
    rows = (data as Transaction[]).map(tx => {
      const itemsStr = tx.items.map(i => `${i.quantity}x ${i.productName}`).join('; ');
      return [
        tx.transactionNumber,
        formatDateTime(tx.transactionDate),
        tx.cashierName,
        tx.paymentMethod.toUpperCase(),
        String(tx.items.reduce((s, i) => s + i.quantity, 0)),
        String(tx.subtotal),
        String(tx.discount),
        String(tx.total),
        tx.status.toUpperCase(),
        itemsStr,
        tx.notes || '',
      ];
    });
  } else if (type === 'product_sales') {
    headers = [
      'SKU',
      'Nama Produk',
      'Kategori',
      'Unit Terjual',
      'Total Revenue',
      'Harga Rata-rata',
      'Stok Saat Ini',
      'Batas Minimum',
      'Status Stok',
    ];
    rows = (data as ProductPerformanceItem[]).map(item => [
      item.sku,
      item.name,
      item.categoryName,
      String(item.unitsSold),
      String(item.revenue),
      String(item.averagePrice),
      String(item.currentStock),
      String(item.minimumStock),
      item.stockStatus,
    ]);
  } else if (type === 'stock_movements') {
    headers = [
      'ID Movement',
      'Waktu',
      'ID Produk',
      'Tipe Movement',
      'Jumlah',
      'Stok Sebelum',
      'Stok Sesudah',
      'Alasan',
      'No Referensi',
      'Catatan',
      'Operator',
    ];
    rows = (data as StockMovement[]).map(m => [
      m.id,
      formatDateTime(m.createdAt),
      m.productId,
      m.type,
      String(m.quantity),
      String(m.stockBefore),
      String(m.stockAfter),
      m.reason,
      m.referenceId || '',
      m.note || '',
      m.createdBy,
    ]);
  } else if (type === 'sales_report') {
    headers = ['Kategori', 'Unit Terjual', 'Total Omzet (Rp)', 'Persentase'];
    rows = (data as CategorySalesItem[]).map(c => [
      c.categoryName,
      String(c.itemsSold),
      String(c.revenue),
      `${c.percentage}%`,
    ]);
  }

  // Build CSV with proper quote escaping for Excel / Google Sheets
  const escapeCell = (val: string): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ];

  // UTF-8 BOM (\uFEFF) to ensure Indonesian character accents and Excel encoding compatibility
  const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
