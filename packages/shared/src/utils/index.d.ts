import { type ClassValue } from 'clsx';
import { Decimal } from 'decimal.js';
/**
 * Merge Tailwind CSS classes with clsx
 */
export declare function cn(...inputs: ClassValue[]): string;
/**
 * A React hook that returns a function to format currency amounts using the organization's default currency
 * and the user's locale for formatting conventions.
 *
 * @returns A function that takes an amount and optional formatting options and returns a formatted currency string.
 */
export declare const useFormattedCurrency: () => ((amount: number | Decimal | string, options?: Intl.NumberFormatOptions) => string);
/**
 * Format a number with commas
 * @param num The number to format
 * @returns Formatted number string with commas
 */
export declare function formatNumber(num: number): string;
/**
 * Calculate the profit margin percentage
 * @param costPrice The cost price
 * @param sellingPrice The selling price
 * @returns The profit margin as a percentage
 */
export declare function calculateProfitMargin(costPrice: number, sellingPrice: number): number;
/**
 * Calculate the selling price based on cost and desired margin
 * @param costPrice The cost price
 * @param marginPercent The desired profit margin percentage
 * @returns The calculated selling price
 */
export declare function calculateSellingPrice(costPrice: number, marginPercent: number): number;
/**
 * Truncate text with ellipsis
 * @param text The text to truncate
 * @param maxLength Maximum length before truncating
 * @returns Truncated text with ellipsis if needed
 */
export declare function truncateText(text: string, maxLength: number): string;
/**
 * Format a date with options
 * @param date The date to format
 * @param options Date formatting options
 * @returns Formatted date string
 */
export declare function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string;
/**
 * Parse a string as a float with a fallback
 * @param value The string value to parse
 * @param fallback The fallback value if parsing fails
 * @returns The parsed number or fallback
 */
export declare function parseFloatSafe(value: string, fallback?: number): number;
export declare function formatShortDate(date: Date | string): string;
/**
 * Get the user's local currency and locale from browser
 * @returns { currency: string, locale: string } The detected currency and locale
 */
export declare function getLocalCurrencyValues(): {
    currency: string;
    locale: string;
};
/**
 * Calculates the percentage change between two numbers.
 * @param current The current value.
 * @param previous The previous value.
 * @returns An object with the absolute percentage value and direction.
 */
export declare function calculatePercentageChange(current: number, previous: number): {
    value: number;
    direction: 'up' | 'down' | 'neutral';
};
export declare const safeJsonParse: <T>(value: any, key: string) => T | null;
interface TimeComponents {
    hours: number;
    minutes: number;
    seconds?: number;
    milliseconds?: number;
}
export declare function combineDateTime(dateInput: Date | string, timeInput: Date | string | TimeComponents): Date;
/**
 * Generates an 8-character unguessable short code.
 * Uses a safe alphabet (no confusing characters like 0, O, 1, I).
 */
export declare function generateShortCode(): string;
export {};
