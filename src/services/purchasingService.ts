import type { PurchaseOrder, ReceivingRecord } from '../types';

/**
 * Format a number as IDR currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date string into local Indonesian readable format
 */
export function formatPurchasingDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

/**
 * Helper to escape CSV cells
 */
function escapeCell(val: unknown): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export Purchase Orders to UTF-8 CSV
 * Requirement 27:
 * Kolom: PO Number, Date, Supplier, Status, Item Count, Total
 */
export function exportPurchaseOrdersCSV(orders: PurchaseOrder[], rangeLabel: string = 'semua'): void {
  const headers = ['PO Number', 'Date', 'Supplier', 'Status', 'Item Count', 'Total'];
  const rows = orders.map(po => [
    po.poNumber,
    formatPurchasingDate(po.orderDate),
    po.supplierNameSnapshot,
    po.status,
    String(po.items?.length || 0),
    String(po.total),
  ]);

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(r => r.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cosplaypos-purchase-orders-${rangeLabel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Receiving Records to UTF-8 CSV
 * Requirement 27:
 * Kolom: Receiving ID, PO Number, Supplier, Date, Product, SKU, Quantity, Unit Cost, Total
 */
export function exportReceivingCSV(records: ReceivingRecord[], rangeLabel: string = 'semua'): void {
  const headers = ['Receiving ID', 'PO Number', 'Supplier', 'Date', 'Product', 'SKU', 'Quantity', 'Unit Cost', 'Total'];
  const rows: string[][] = [];

  records.forEach(rcv => {
    rcv.items.forEach(item => {
      rows.push([
        rcv.receivingNumber,
        rcv.poNumber,
        rcv.supplierName,
        formatPurchasingDate(rcv.receivedAt),
        item.productNameSnapshot,
        item.skuSnapshot,
        String(item.qtyReceivedNow),
        String(item.actualUnitCost),
        String(item.subtotal),
      ]);
    });
  });

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(r => r.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `cosplaypos-receiving-records-${rangeLabel}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
