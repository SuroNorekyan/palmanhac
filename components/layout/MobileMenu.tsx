"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { IconButton } from "@/components/common/IconButton";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { SearchBar } from "@/components/common/SearchBar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { NavConfig } from "@/config/nav";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { withLocale } from "@/lib/utils/locale";
import { CartIndicator, FavoritesIndicator } from "./HeaderIndicators";

export function MobileMenu({
  nav,
  dictionary,
  locale,
}: {
  nav: NavConfig;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <IconButton
          icon={<Menu className="h-5 w-5" />}
          srLabel="Open menu"
          className="border-0 bg-transparent text-neutral-900 hover:bg-neutral-100"
        />
      </SheetTrigger>
      <SheetContent className="gap-6">
        <SheetHeader className="items-start gap-2">
          <SheetTitle className="text-2xl font-semibold text-neutral-900">
            Palmanhac
          </SheetTitle>
          <Suspense fallback={<div className="h-8 w-20 rounded-full bg-neutral-100" />}>
            <LanguageSwitcher />
          </Suspense>
        </SheetHeader>
        <Suspense
          fallback={
            <div className="h-11 w-full animate-pulse rounded-full bg-neutral-100" />
          }
        >
          <SearchBar placeholder={dictionary.nav.searchPlaceholder} />
        </Suspense>
        <div className="space-y-6">
          <div className="space-y-3">
            {nav.main.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={withLocale(locale, item.href)}
                  className="block text-lg font-medium text-neutral-800"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>
          <div className="space-y-3 border-t border-[rgb(var(--border))] pt-4">
            {nav.secondary.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={withLocale(locale, item.href)}
                  className="block text-sm font-medium text-neutral-600"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 border-t border-[rgb(var(--border))] pt-4">
          <CartIndicator label={dictionary.nav.cart} locale={locale} />
          <FavoritesIndicator label={dictionary.nav.favorites} locale={locale} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
