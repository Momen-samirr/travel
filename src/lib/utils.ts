import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { normalizeCurrency } from "@/lib/currency";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "EGP"): string {
  const normalizedCurrency = normalizeCurrency(currency);
  const currencyDisplay = normalizedCurrency === "EGP" ? "code" : "symbol";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    currencyDisplay,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
