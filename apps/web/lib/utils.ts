import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency,
  }).format(amount);
}
