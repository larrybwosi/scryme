import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useMemo } from "react";
import { Decimal } from "decimal.js";
import { useOrganization } from "./providers/organization-context";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A React hook that returns a function to format currency amounts using the organization's default currency
 * and the user's locale for formatting conventions.
 *
 * @returns A function that takes an amount and optional formatting options and returns a formatted currency string.
 */

export const useFormattedCurrency = (): ((
  amount: number | Decimal | string,
  options?: Intl.NumberFormatOptions,
) => string) => {
  const { currency } = useOrganization();
  // Determine the user's locale
  const locale =
    typeof navigator !== "undefined" ? navigator.language : "en-US";

  // Return a memoized formatting function that depends on currency and locale
  return useMemo(() => {
    return (
      amount: number | Decimal | string,
      options: Intl.NumberFormatOptions = {},
    ): string => {
      // Parse the amount to a number, handling different input types
      let parsedAmount: number;
      if (typeof amount === "string") {
        parsedAmount = parseFloat(amount);
      } else if (typeof amount === "object" && "toNumber" in amount) {
        // Handle Prisma.Decimal
        parsedAmount = amount.toNumber();
      } else {
        parsedAmount = amount as number;
      }

      // Handle invalid amounts
      if (isNaN(parsedAmount)) {
        console.warn("Invalid amount provided to formatCurrency:", amount);
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 2, // Default to 2 decimal places for invalid amounts
          ...options,
        }).format(0); // Format 0 with the correct currency symbol
      }

      // Attempt to format the amount using Intl.NumberFormat
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 2, // Default to 2 decimal places unless overridden
          ...options, // Merge any additional formatting options
        }).format(parsedAmount);
      } catch (error) {
        // Fallback to basic formatting with the currency symbol
        console.error(
          `Error formatting currency (locale: ${locale}, currency: ${currency}):`,
          error,
        );
        const fallbackFormatter = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "KSH", // Fallback to KSH if the currency is invalid
          maximumFractionDigits: options.maximumFractionDigits ?? 2,
        });
        return fallbackFormatter.format(parsedAmount);
      }
    };
  }, [currency, locale]); // Recreate the formatting function only when currency or locale changes
};

/**
 * Format a number with commas
 * @param num The number to format
 * @returns Formatted number string with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Calculate the profit margin percentage
 * @param costPrice The cost price
 * @param sellingPrice The selling price
 * @returns The profit margin as a percentage
 */
export function calculateProfitMargin(
  costPrice: number,
  sellingPrice: number,
): number {
  if (costPrice <= 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Calculate the selling price based on cost and desired margin
 * @param costPrice The cost price
 * @param marginPercent The desired profit margin percentage
 * @returns The calculated selling price
 */
export function calculateSellingPrice(
  costPrice: number,
  marginPercent: number,
): number {
  return costPrice * (1 + marginPercent / 100);
}

/**
 * Truncate text with ellipsis
 * @param text The text to truncate
 * @param maxLength Maximum length before truncating
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Format a date with options
 * @param date The date to format
 * @param options Date formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  try {
    // Handle null or undefined input
    if (date === null || date === undefined) {
      console.warn(
        "formatDate: Received null or undefined date, returning fallback",
      );
      return "Invalid Date";
    }

    // Handle empty string
    if (typeof date === "string" && date.trim() === "") {
      console.warn(
        "formatDate: Received empty string date, returning fallback",
      );
      return "Invalid Date";
    }

    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if the date is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      console.warn("formatDate: Invalid date provided:", date);
      return "Invalid Date";
    }

    // Validate options
    if (options && typeof options !== "object") {
      console.warn("formatDate: Invalid options provided, using defaults");
      options = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
    }

    const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
      dateObj,
    );

    // Check if formatting resulted in an invalid output
    if (!formattedDate || formattedDate === "Invalid Date") {
      console.warn(
        "formatDate: DateTimeFormat produced invalid result for date:",
        date,
      );
      return "Invalid Date";
    }

    return formattedDate;
  } catch (error) {
    console.error("formatDate: Unexpected error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Parse a string as a float with a fallback
 * @param value The string value to parse
 * @param fallback The fallback value if parsing fails
 * @returns The parsed number or fallback
 */
export function parseFloatSafe(value: string, fallback: number = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

export function formatShortDate(date: Date | string): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Helper function to get currency code for a region
 * Note: This is a simplified version - you might want to expand it
 * or use a proper library like currency-codes
 */
function getCurrencyCodeForRegion(region: string): string {
  const regionToCurrency: Record<string, string> = {
    US: "USD",
    GB: "GBP",
    EU: "EUR",
    DE: "EUR",
    FR: "EUR",
    JP: "JPY",
    IN: "INR",
    CN: "CNY",
    BR: "BRL",
    CA: "CAD",
    AU: "AUD",
    MX: "MXN",
    KE: "KSH",
    NG: "NGN",
    ZA: "ZAR",
    // Add more regions and their corresponding currencies as needed
  };

  return regionToCurrency[region] || "USD";
}

/**
 * Get the user's local currency and locale from browser
 * @returns { currency: string, locale: string } The detected currency and locale
 */
export function getLocalCurrencyValues(): { currency: string; locale: string } {
  // Default values
  let locale = "en-US";
  let currency = "USD";

  // Try to detect from browser if available
  if (typeof window !== "undefined" && window.navigator) {
    try {
      locale = window.navigator.language;

      // Get the currency for the detected locale
      const region = locale.split("-")[1] || "US";

      currency = getCurrencyCodeForRegion(region);
    } catch (e) {
      console.warn("Could not detect local currency values", e);
    }
  }

  return { currency, locale };
}

/**
 * Calculates the percentage change between two numbers.
 * @param current The current value.
 * @param previous The previous value.
 * @returns An object with the absolute percentage value and direction.
 */
export function calculatePercentageChange(
  current: number,
  previous: number,
): { value: number; direction: "up" | "down" | "neutral" } {
  if (previous === 0) {
    if (current > 0) {
      return { value: 100, direction: "up" };
    }
    return { value: 0, direction: "neutral" };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(parseFloat(change.toFixed(1))), // Keep one decimal place
    direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

// Add this helper function for better debugging
export const safeJsonParse = <T>(value: any, key: string): T | null => {
  try {
    if (value === null || value === undefined) return null;
    if (typeof value === "object") return value as T;
    if (typeof value === "string") return JSON.parse(value) as T;
    return value as T;
  } catch (error) {
    console.error(
      `Failed to parse Redis value for key ${key}:`,
      error,
      "Value:",
      value,
    );
    return null;
  }
};

interface TimeComponents {
  hours: number;
  minutes: number;
  seconds?: number;
  milliseconds?: number;
}

export function combineDateTime(
  dateInput: Date | string,
  timeInput: Date | string | TimeComponents,
): Date {
  const date = new Date(dateInput);

  if (typeof timeInput === "string") {
    const [hours, minutes, seconds] = timeInput.split(":").map(Number);
    date.setHours(hours, minutes || 0, seconds || 0, 0);
  } else if (timeInput instanceof Date) {
    date.setHours(
      timeInput.getHours(),
      timeInput.getMinutes(),
      timeInput.getSeconds(),
      timeInput.getMilliseconds(),
    );
  } else {
    date.setHours(
      timeInput.hours,
      timeInput.minutes || 0,
      timeInput.seconds || 0,
      timeInput.milliseconds || 0,
    );
  }

  return date;
}
