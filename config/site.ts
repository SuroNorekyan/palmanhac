export const locales = ["en", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

type ContactInfo = {
  email: string;
  phone: string;
  address: string;
};

export const siteConfig = {
  name: "Palmanhac Shop",
  domain: "palmanhac.pt",
  description:
    "Palmanhac Shop showcases premium Portuguese liqueurs, aguardente, and specialty spirits crafted in small batches.",
  defaultLocale,
  locales,
  freeShippingThreshold: 60,
  currency: "EUR",
  contact: {
    email: "info@palmanhac-shop.pt",
    phone: "+351 964 690 254",
    address:
      "Destilaria-Adega Rua de Mercúrio lote 38, Vale do Alecrim, Palmela, 2950-019, Portugal",
  } satisfies ContactInfo,
  social: {
    instagram: "https://instagram.com/palmanhac",
    facebook: "https://facebook.com/palmanhac",
  },
};

export type SiteConfig = typeof siteConfig;

export const resolveLocale = (candidate: string): Locale =>
  locales.includes(candidate as Locale) ? (candidate as Locale) : defaultLocale;

export const extractLocale = async (params?: Promise<{ locale: string }>) => {
  if (!params) {
    return defaultLocale;
  }

  const { locale } = await params;
  return resolveLocale(locale);
};
