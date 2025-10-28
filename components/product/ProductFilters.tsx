"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function buildUrl({
  pathname,
  searchParams,
  next,
}: {
  pathname: string;
  searchParams: URLSearchParams;
  next: Record<string, string | null>;
}) {
  const params = new URLSearchParams(searchParams.toString());
  Object.entries(next).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  });

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function ProductFilters({ dictionary }: { dictionary: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "price-asc";
  const isPriceDesc = sort === "price-desc";

  const updateSearchParam = (next: Record<string, string | null>) => {
    router.replace(
      buildUrl({
        pathname: pathname ?? "/",
        searchParams,
        next,
      }),
    );
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          {dictionary.catalog.heading}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => updateSearchParam({ q: null, sort: "price-asc" })}
        >
          {dictionary.catalog.clearSearch}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {dictionary.catalog.searchLabel}
          </span>
          <Input
            defaultValue={query}
            placeholder={dictionary.catalog.searchPlaceholder}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                const target = event.target as HTMLInputElement;
                updateSearchParam({ q: target.value || null });
              }
            }}
            onBlur={(event) => {
              const value = event.target.value;
              if (value !== query) {
                updateSearchParam({ q: value || null });
              }
            }}
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {dictionary.catalog.sortLabel}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              updateSearchParam({ sort: isPriceDesc ? "price-asc" : "price-desc" })
            }
          >
            {isPriceDesc
              ? dictionary.catalog.priceSort.desc
              : dictionary.catalog.priceSort.asc}
          </Button>
        </div>
      </div>
    </div>
  );
}
