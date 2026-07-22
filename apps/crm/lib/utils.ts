import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrencySymbol(currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).formatToParts(0).find(part => part.type === 'currency')?.value || '$';
  } catch (e) {
    return '$';
  }
}

export function formatCurrency(amount: number | string | any, currency = 'USD'): string {
  const value = typeof amount === 'number' ? amount : Number(amount);
  const locale = currency === 'USD' ? 'en-US' : currency === 'KES' ? 'en-KE' : undefined;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(isNaN(value) ? 0 : value);
}

export function formatDate(date: string | Date | any): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
