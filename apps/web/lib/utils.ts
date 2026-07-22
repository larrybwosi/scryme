import { type ClassValue, clsx } from "clsx";
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

export function formatCurrency(amount: number, currency: string = "KES") {
  const locale = currency === "USD" ? "en-US" : currency === "KES" ? "en-KE" : undefined;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}
