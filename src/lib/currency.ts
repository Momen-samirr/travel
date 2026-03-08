export const SUPPORTED_CURRENCIES = ["EGP", "USD"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "EGP";

export function normalizeCurrency(
  currency?: string | null
): SupportedCurrency {
  const normalized = currency?.toUpperCase();
  if (normalized === "USD") return "USD";
  return "EGP";
}
