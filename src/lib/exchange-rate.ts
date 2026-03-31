import { prisma } from "@/lib/prisma";
import { SupportedCurrency } from "@/lib/currency";

function getFallbackRate(fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency): number {
  if (fromCurrency === toCurrency) return 1;

  const egpToUsd = Number(process.env.FX_RATE_EGP_USD || "0.02");
  const usdToEgp = Number(process.env.FX_RATE_USD_EGP || "50");

  if (fromCurrency === "EGP" && toCurrency === "USD") {
    return egpToUsd;
  }
  if (fromCurrency === "USD" && toCurrency === "EGP") {
    return usdToEgp;
  }
  return 1;
}

export async function getExchangeRate(
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const row = await prisma.exchangeRate.findUnique({
    where: {
      fromCurrency_toCurrency: {
        fromCurrency,
        toCurrency,
      },
    },
  });

  if (row) {
    return Number(row.rate);
  }

  return getFallbackRate(fromCurrency, toCurrency);
}

export async function convertAmount(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): Promise<{ amount: number; fxRate: number }> {
  const fxRate = await getExchangeRate(fromCurrency, toCurrency);
  const converted = Number((amount * fxRate).toFixed(2));
  return { amount: converted, fxRate };
}
