/**
 * Format number to Indonesian Rupiah currency string
 */
export function formatRupiah(amount: number, prefix: boolean = true, space: boolean = true): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (!prefix) return formatted;
  return space ? `Rp ${formatted}` : `Rp${formatted}`;
}

/**
 * Format date time to Indonesian format
 * Example: 26 Sep 2026, 14:35:12
 */
export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Generate invoice number
 * Format: INV-YYYYMMDD-XXX
 */
export function generateInvoiceNumber(sequence: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(3, '0');
  return `INV-${y}${m}${d}-${seq}`;
}
