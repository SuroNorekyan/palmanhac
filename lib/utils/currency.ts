import type { Locale } from "@/config/site";

const localeMap: Record<Locale, string> = {
  en: "en-GB",
  pt: "pt-PT",
};

const currencyCache = new Map<Locale, Intl.NumberFormat>();
const amountCache = new Map<Locale, Intl.NumberFormat>();

const getCurrencyFormatter = (locale: Locale) => {
  if (!currencyCache.has(locale)) {
    currencyCache.set(
      locale,
      new Intl.NumberFormat(localeMap[locale], {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
      }),
    );
  }

  return currencyCache.get(locale)!;
};

const getAmountFormatter = (locale: Locale) => {
  if (!amountCache.has(locale)) {
    amountCache.set(
      locale,
      new Intl.NumberFormat(localeMap[locale], {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    );
  }

  return amountCache.get(locale)!;
};

export const centsToEuros = (cents: number) => cents / 100;

export const formatCurrency = (locale: Locale, cents: number): string =>
  getCurrencyFormatter(locale).format(centsToEuros(cents));

export const formatEuroAmount = (locale: Locale, amount: number): string =>
  `${getAmountFormatter(locale).format(amount)} €`;
