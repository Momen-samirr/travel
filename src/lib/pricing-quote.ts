import { prisma } from "@/lib/prisma";
import { convertAmount } from "@/lib/exchange-rate";
import { SupportedCurrency, normalizeCurrency } from "@/lib/currency";

export type QuotePriceSource = "BASE" | "FX" | "OVERRIDE";

export interface SettlementQuote {
  settledAmount: number;
  settledCurrency: SupportedCurrency;
  sourceAmount: number;
  sourceCurrency: SupportedCurrency;
  fxRate: number | null;
  priceSource: QuotePriceSource;
}

interface SettlementContext {
  sourceAmount: number;
  sourceCurrency: SupportedCurrency;
  preferredCurrency: SupportedCurrency;
  charterPackageId?: string | null;
  tourId?: string | null;
}

async function getCharterOverrideRate(
  charterPackageId: string,
  sourceCurrency: SupportedCurrency,
  preferredCurrency: SupportedCurrency
): Promise<number | null> {
  const pkg = await prisma.charterTravelPackage.findUnique({
    where: { id: charterPackageId },
    select: { basePrice: true, currency: true },
  });
  if (!pkg || !pkg.basePrice) return null;

  const packageBaseCurrency = normalizeCurrency(pkg.currency);
  const packageBasePrice = Number(pkg.basePrice);
  if (packageBasePrice <= 0 || packageBaseCurrency !== sourceCurrency) {
    return null;
  }

  const override = await prisma.charterPackagePriceOverride.findUnique({
    where: {
      packageId_currency: {
        packageId: charterPackageId,
        currency: preferredCurrency,
      },
    },
  });
  if (!override?.basePrice) return null;

  const overrideBasePrice = Number(override.basePrice);
  if (overrideBasePrice <= 0) return null;

  return overrideBasePrice / packageBasePrice;
}

async function getTourOverrideRate(
  tourId: string,
  sourceCurrency: SupportedCurrency,
  preferredCurrency: SupportedCurrency
): Promise<number | null> {
  const tour = await prisma.tour.findUnique({
    where: { id: tourId },
    select: { price: true, currency: true },
  });
  if (!tour) return null;
  const tourCurrency = normalizeCurrency(tour.currency);
  const tourBasePrice = Number(tour.price);
  if (tourCurrency !== sourceCurrency || tourBasePrice <= 0) {
    return null;
  }

  const override = await prisma.tourPriceOverride.findUnique({
    where: {
      tourId_currency: {
        tourId,
        currency: preferredCurrency,
      },
    },
  });
  if (!override?.price) return null;
  const overridePrice = Number(override.price);
  if (overridePrice <= 0) return null;
  return overridePrice / tourBasePrice;
}

export async function getSettlementQuote(context: SettlementContext): Promise<SettlementQuote> {
  const { sourceAmount, sourceCurrency, preferredCurrency, charterPackageId, tourId } = context;

  if (sourceCurrency === preferredCurrency) {
    return {
      settledAmount: Number(sourceAmount.toFixed(2)),
      settledCurrency: sourceCurrency,
      sourceAmount: Number(sourceAmount.toFixed(2)),
      sourceCurrency,
      fxRate: 1,
      priceSource: "BASE",
    };
  }

  if (charterPackageId) {
    const overrideRate = await getCharterOverrideRate(
      charterPackageId,
      sourceCurrency,
      preferredCurrency
    );
    if (overrideRate) {
      return {
        settledAmount: Number((sourceAmount * overrideRate).toFixed(2)),
        settledCurrency: preferredCurrency,
        sourceAmount: Number(sourceAmount.toFixed(2)),
        sourceCurrency,
        fxRate: null,
        priceSource: "OVERRIDE",
      };
    }
  }

  if (tourId) {
    const overrideRate = await getTourOverrideRate(tourId, sourceCurrency, preferredCurrency);
    if (overrideRate) {
      return {
        settledAmount: Number((sourceAmount * overrideRate).toFixed(2)),
        settledCurrency: preferredCurrency,
        sourceAmount: Number(sourceAmount.toFixed(2)),
        sourceCurrency,
        fxRate: null,
        priceSource: "OVERRIDE",
      };
    }
  }

  const converted = await convertAmount(sourceAmount, sourceCurrency, preferredCurrency);
  return {
    settledAmount: converted.amount,
    settledCurrency: preferredCurrency,
    sourceAmount: Number(sourceAmount.toFixed(2)),
    sourceCurrency,
    fxRate: converted.fxRate,
    priceSource: "FX",
  };
}
