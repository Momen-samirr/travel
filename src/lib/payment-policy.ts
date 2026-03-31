import { SupportedCurrency, requireSupportedCurrency } from "@/lib/currency";

export type OnlineProvider = "PAYMOB" | "PAYIN";

export function resolveOnlineProvider(currency: string): OnlineProvider {
  const supportedCurrency = requireSupportedCurrency(currency);
  if (supportedCurrency === "USD") {
    return "PAYIN";
  }
  return "PAYMOB";
}

export function ensureProviderSupportsCurrency(
  provider: OnlineProvider,
  currency: string
): SupportedCurrency {
  const supportedCurrency = requireSupportedCurrency(currency);

  if (provider === "PAYIN" && supportedCurrency !== "USD") {
    throw new Error(`Provider ${provider} does not support ${supportedCurrency}`);
  }
  if (provider === "PAYMOB" && supportedCurrency === "USD") {
    throw new Error(`Provider ${provider} is not configured for USD in this setup`);
  }
  return supportedCurrency;
}
