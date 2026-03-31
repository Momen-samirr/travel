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

export const CURRENCY_COOKIE_KEY = "preferred_currency";

export function isSupportedCurrency(currency?: string | null): currency is SupportedCurrency {
  if (!currency) return false;
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as SupportedCurrency);
}

export function requireSupportedCurrency(currency?: string | null): SupportedCurrency {
  if (!isSupportedCurrency(currency)) {
    throw new Error(`Unsupported currency "${currency ?? ""}"`);
  }
  return currency.toUpperCase() as SupportedCurrency;
}
