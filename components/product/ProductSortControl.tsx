"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

type ProductSortControlProps = {
  sortLabel: string;
  ascLabel: string;
  descLabel: string;
  initialSort: "price-asc" | "price-desc";
  value?: "price-asc" | "price-desc";
  onValueChange?: (value: "price-asc" | "price-desc") => void;
};

export function ProductSortControl({
  sortLabel,
  ascLabel,
  descLabel,
  initialSort,
  value,
  onValueChange,
}: ProductSortControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedSort = searchParams?.get("sort");
  const isControlled = typeof value !== "undefined" && !!onValueChange;
  const currentSort = isControlled
    ? value
    : resolvedSort === "price-desc"
      ? "price-desc"
      : resolvedSort === "price-asc"
        ? "price-asc"
        : initialSort;

  const updateSort = (value: "price-asc" | "price-desc") => {
    if (isControlled && onValueChange) {
      onValueChange(value);
      return;
    }
    const params = new URLSearchParams(searchParams?.toString());
    params.set("sort", value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : (pathname ?? "/"), {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-col gap-2 text-left sm:flex-row sm:items-center sm:gap-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {sortLabel}
      </span>
      <div className="relative inline-flex w-full max-w-[220px] items-center">
        <select
          value={currentSort}
          onChange={(event) =>
            updateSort(event.target.value === "price-desc" ? "price-desc" : "price-asc")
          }
          className="w-full appearance-none rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
        >
          <option value="price-asc">{ascLabel}</option>
          <option value="price-desc">{descLabel}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-neutral-400" />
      </div>
    </div>
  );
}
