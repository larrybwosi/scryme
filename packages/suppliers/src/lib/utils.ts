import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useMemo } from "react";
import { Decimal } from "decimal.js";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date with options
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
    if (date === null || date === undefined) return "Invalid Date";
    if (typeof date === "string" && date.trim() === "") return "Invalid Date";

    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return new Intl.DateTimeFormat("en-US", options).format(dateObj);
  } catch (error) {
    return "Invalid Date";
  }
}

// Mock useOrgStore for the package if needed or expect it to be provided
// For now, I'll make useFormattedCurrency accept an optional currency
export const useFormattedCurrency = (
  providedCurrency?: string,
): ((
  amount: number | Decimal | string,
  options?: Intl.NumberFormatOptions,
) => string) => {
  const currency = providedCurrency || "KES";
  const locale =
    typeof navigator !== "undefined" ? navigator.language : "en-US";

  return useMemo(() => {
    return (
      amount: number | Decimal | string,
      options: Intl.NumberFormatOptions = {},
    ): string => {
      let parsedAmount: number;
      if (typeof amount === "string") {
        parsedAmount = parseFloat(amount);
      } else if (typeof amount === "object" && "toNumber" in amount) {
        parsedAmount = (amount as any).toNumber();
      } else {
        parsedAmount = amount as number;
      }

      if (isNaN(parsedAmount)) {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
          ...options,
        }).format(0);
      }

      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
          ...options,
        }).format(parsedAmount);
      } catch (error) {
        return `${currency} ${parsedAmount.toFixed(2)}`;
      }
    };
  }, [currency, locale]);
};
