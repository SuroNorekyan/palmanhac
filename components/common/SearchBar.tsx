"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultLocale, locales, type Locale } from "@/config/site";
import { withLocale } from "@/lib/utils/locale";

export function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(() => params.get("q") ?? "");

  const currentLocale = (() => {
    if (!pathname) return defaultLocale;
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return defaultLocale;
    return locales.includes(parts[0] as Locale) ? (parts[0] as Locale) : defaultLocale;
  })();

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const next = value.trim();
      const basePath = withLocale(currentLocale, "/search");
      const url = new URL(basePath, window.location.origin);
      if (next) {
        url.searchParams.set("q", next);
      } else {
        url.searchParams.delete("q");
      }
      router.push(url.toString().replace(url.origin, ""));
    },
    [router, value, currentLocale],
  );

  return (
    <form onSubmit={onSubmit} className="relative flex w-full max-w-md items-center">
      <Search className="absolute left-4 h-5 w-5 text-neutral-400" aria-hidden />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-12 pr-12"
        aria-label={placeholder}
      />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        className="absolute right-2 h-8 rounded-full px-4 text-xs"
      >
        Go
      </Button>
    </form>
  );
}
