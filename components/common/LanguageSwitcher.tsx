"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { defaultLocale, locales } from "@/config/site";
import { cn } from "@/lib/utils/format";
import { withLocale } from "@/lib/utils/locale";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLocale = useMemo(() => {
    if (!pathname) return defaultLocale;
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return defaultLocale;
    return locales.includes(parts[0] as (typeof locales)[number])
      ? (parts[0] as (typeof locales)[number])
      : defaultLocale;
  }, [pathname]);

  const changeLocale = useCallback(
    (locale: (typeof locales)[number]) => {
      if (!pathname) return;
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length === 0) {
        router.push(withLocale(locale, "/"));
        return;
      }

      const [, ...rest] = locales.includes(parts[0] as (typeof locales)[number])
        ? (parts as string[])
        : ([defaultLocale, ...parts] as string[]);

      const basePath = `/${rest.join("/")}`.replace(/\/$/, "");
      const target = withLocale(locale, basePath === "" ? "/" : basePath);
      const qs = searchParams.toString();
      router.push(qs ? `${target}?${qs}` : target);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex items-center gap-1 rounded-full border border-[rgb(var(--border))] bg-white p-1 text-xs font-semibold">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          className={cn(
            "rounded-full px-3 py-1 uppercase transition",
            locale === currentLocale
              ? "bg-neutral-900 text-white"
              : "text-neutral-500 hover:text-neutral-900",
          )}
          onClick={() => changeLocale(locale)}
          aria-pressed={locale === currentLocale}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
