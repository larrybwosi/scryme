import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseDateInput(
  value: Date | string | null | undefined,
): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) {
    return isValid(value) ? value : undefined;
  }

  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = parseISO(trimmed);
  if (isValid(parsed)) return parsed;

  const fallback = new Date(trimmed);
  return isValid(fallback) ? fallback : undefined;
}

export function formatDateInput(date: Date | null | undefined): string | undefined {
  if (!date || !isValid(date)) return undefined;
  return format(date, "yyyy-MM-dd");
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

export function getResolvedApiUrl(): string {
  let rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const defaultApiUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3002"
      : "https://api.scryme.tech";

  let apiUrl = defaultApiUrl;
  if (
    rawApiUrl &&
    typeof rawApiUrl === "string" &&
    !rawApiUrl.includes("PLACEHOLDER") &&
    (rawApiUrl.startsWith("http://") || rawApiUrl.startsWith("https://"))
  ) {
    apiUrl = rawApiUrl;
  }

  if (
    process.env.NODE_ENV === "production" &&
    (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1"))
  ) {
    apiUrl = "https://api.scryme.tech";
  }

  try {
    const parsed = new URL(apiUrl);
    if (
      parsed.hostname.endsWith("scryme.tech") ||
      process.env.NODE_ENV === "production"
    ) {
      parsed.port = "";
    }
    apiUrl = parsed.toString().replace(/\/$/, "");
  } catch (e) {
    console.error("Failed to parse API URL in getResolvedApiUrl:", e);
  }

  return apiUrl;
}
