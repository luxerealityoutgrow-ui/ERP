// src/lib/formatters.ts

/**
 * Formats a number as Indian currency (₹)
 */
export function formatCurrency(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a number in the Indian numbering system (Lakhs/Crores)
 */
export function formatNumber(num: number | string | undefined): string {
  if (num === undefined || num === null) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';

  return new Intl.NumberFormat('en-IN').format(n);
}

/**
 * Formats a date to Indian standard (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d).replace(/\//g, '-'); // Usually DD-MM-YYYY or DD/MM/YYYY
}

/**
 * Converts price to short Indian notation (k, L, Cr)
 */
export function formatPriceShort(price: number | string | undefined): string {
  if (price === undefined || price === null) return '₹0';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '₹0';

  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(2)} k`;
  }
  return `₹${num}`;
}
