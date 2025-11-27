import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { IconButton } from "@/components/common/IconButton";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { SearchBar } from "@/components/common/SearchBar";
import type { NavConfig } from "@/config/nav";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { withLocale } from "@/lib/utils/locale";
import { DesktopNav } from "./DesktopNav";
import { CartIndicator, FavoritesIndicator } from "./HeaderIndicators";
import { MobileMenu } from "./MobileMenu";

export function Header({
  nav,
  dictionary,
  locale,
}: {
  nav: NavConfig;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const aboutFirstMain = (() => {
    const about = nav.main.find((item) => item.href === "/about");
    if (!about) {
      return nav.main;
    }
    const rest = nav.main.filter((item) => item.href !== "/about");
    return [about, ...rest];
  })();

  const reorderedNav: NavConfig = {
    ...nav,
    main: aboutFirstMain,
  };

  return (
    <header className="relative z-40 border-b border-white/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="container flex items-center gap-4 py-4">
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="lg:hidden">
            <MobileMenu nav={reorderedNav} dictionary={dictionary} locale={locale} />
          </div>
          <Link
            href={withLocale(locale, "/")}
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900"
            aria-label="Palmanhac home"
          >
            <Image
              src="/assets/logo/palmanhac-logo.png"
              alt="Palmanhac logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
              priority
            />
            <span className="hidden text-base font-semibold sm:inline">Palmanhac</span>
          </Link>
        </div>
        <DesktopNav items={aboutFirstMain} locale={locale} />
        <div className="ml-auto hidden lg:flex lg:flex-1 lg:justify-center">
          <Suspense
            fallback={
              <div className="h-11 w-full animate-pulse rounded-full bg-neutral-100" />
            }
          >
            <SearchBar placeholder={dictionary.nav.searchPlaceholder} />
          </Suspense>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:block">
            <Suspense fallback={<div className="h-9 w-20 rounded-full bg-neutral-100" />}>
              <LanguageSwitcher />
            </Suspense>
          </div>
          <FavoritesIndicator label={dictionary.nav.favorites} locale={locale} />
          <CartIndicator label={dictionary.nav.cart} locale={locale} />
          <Link href={withLocale(locale, "/account")} className="hidden md:inline-flex">
            <IconButton
              icon={<User className="h-5 w-5" />}
              srLabel={dictionary.nav.account}
              className="border-0 bg-transparent text-neutral-700 hover:bg-neutral-900 hover:text-white"
            />
          </Link>
        </div>
      </div>
      <div className="border-t border-white/60 bg-white/50 py-3 backdrop-blur lg:hidden">
        <div className="container">
          <Suspense
            fallback={
              <div className="h-11 w-full animate-pulse rounded-full bg-neutral-100" />
            }
          >
            <SearchBar placeholder={dictionary.nav.searchPlaceholder} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
