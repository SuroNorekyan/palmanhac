export const locales = ["en", "pt"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

type ContactInfo = {
  email: string;
  phone: string;
  address: string;
};

export const siteConfig = {
  name: "Palmanhac Shop",
  domain: "palmanhacshop.pt",
  description:
    "Palmanhac Shop showcases premium Portuguese liqueurs, aguardente, and specialty spirits crafted in small batches.",
  defaultLocale,
  locales,
  freeShippingThreshold: 50,
  currency: "EUR",
  contact: {
    email: "hello@palmanhacshop.pt",
    phone: "+351 910 000 000",
    address: "Rua da Alegria 123, 1200-123 Lisboa, Portugal",
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
