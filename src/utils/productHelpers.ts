import type { Product } from '../types';

export type StockStatus = 'ready' | 'low' | 'out';

/**
 * Determine stock status logically
 */
export function getStockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return 'out';
  if (product.stock <= product.minimumStock) return 'low';
  return 'ready';
}

/**
 * Return badge info for UI
 */
export function getStockBadgeInfo(product: Product): { label: string; className: string } {
  const status = getStockStatus(product);
  switch (status) {
    case 'out':
      return { label: '🚫 HABIS', className: 'out' };
    case 'low':
      return { label: `⚠ Tinggal ${product.stock}`, className: 'low' };
    case 'ready':
      return { label: `${product.stock} Stok`, className: 'ready' };
  }
}

/**
 * Calculate margin nominal and percentage cleanly
 */
export function calculateMargin(price: number, costPrice: number): { nominal: number; percentage: number } {
  const nominal = Math.max(0, price - costPrice);
  const percentage = price > 0 ? Math.max(0, ((price - costPrice) / price) * 100) : 0;
  return {
    nominal,
    percentage: Math.round(percentage * 10) / 10,
  };
}

/**
 * Compress uploaded image via HTML5 Canvas (100% offline, lightweight DataURL for IndexedDB)
 */
export function compressImageFile(
  file: File,
  maxWidth = 320,
  maxHeight = 320,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memproses gambar produk'));
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
  });
}

/**
 * Generate fallback SVG matching CosplayPOS theme
 */
export function generateDefaultMerchSvg(name: string, category: string): string {
  const shortName = name.slice(0, 10).toUpperCase();
  const catTag = category.slice(0, 8).toUpperCase() || 'MERCH';
  
  // Choose gradient based on first letter
  const charCode = name.charCodeAt(0) || 65;
  const colors = [
    ['#6366f1', '#a855f7'],
    ['#ec4899', '#f43f5e'],
    ['#06b6d4', '#3b82f6'],
    ['#10b981', '#059669'],
    ['#f59e0b', '#d97706'],
  ];
  const pair = colors[charCode % colors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${pair[0]}"/>
        <stop offset="100%" stop-color="${pair[1]}"/>
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="12" fill="url(#g)"/>
    <circle cx="80" cy="65" r="32" fill="rgba(255,255,255,0.2)"/>
    <text x="80" y="73" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">✨</text>
    <rect x="16" y="112" width="128" height="24" rx="6" fill="rgba(0,0,0,0.35)"/>
    <text x="80" y="128" font-family="system-ui, sans-serif" font-weight="700" font-size="10" fill="#f8fafc" text-anchor="middle">${shortName || catTag}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
