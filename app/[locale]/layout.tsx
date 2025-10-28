import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AgeGate } from "@/components/layout/AgeGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/layout/Providers";
import { TopBanner } from "@/components/layout/TopBanner";
import { navConfig } from "@/config/nav";
import { locales, siteConfig, type Locale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;

  if (!locales.includes(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const navigation = navConfig[locale];

  return (
    <Providers>
      <TopBanner banner={dictionary.banner} />
      <Header nav={navigation} dictionary={dictionary} locale={locale} />
      <main className="container space-y-16 py-12">{children}</main>
      <Footer
        nav={navigation}
        site={siteConfig}
        dictionary={dictionary}
        locale={locale}
      />
      <AgeGate copy={dictionary.ageGate} locale={locale} />
    </Providers>
  );
}
