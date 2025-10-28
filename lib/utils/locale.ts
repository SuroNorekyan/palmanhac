import type { Locale } from "@/config/site";

export const withLocale = (locale: Locale, path: string): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
};
