"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { ProductListItem } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { ProductSortControl } from "./ProductSortControl";

const resolveSort = (
  value: string | null,
  fallback: "price-asc" | "price-desc",
): "price-asc" | "price-desc" => {
  if (value === "price-desc") {
    return "price-desc";
  }
  if (value === "price-asc") {
    return "price-asc";
  }
  return fallback;
};

const getSortFromLocation = (fallback: "price-asc" | "price-desc") => {
  if (typeof window === "undefined") return fallback;
  const params = new URLSearchParams(window.location.search);
  const sortParam = params.get("sort");
  return resolveSort(sortParam, fallback);
};

type ProductListingSectionProps = {
  products: ProductListItem[];
  dictionary: Dictionary;
  locale: Locale;
  initialSort: "price-asc" | "price-desc";
};

export function ProductListingSection({
  products,
  dictionary,
  locale,
  initialSort,
}: ProductListingSectionProps) {
  const [sortOrder, setSortOrder] = useState<"price-asc" | "price-desc">(initialSort);

  useEffect(() => {
    setSortOrder(getSortFromLocation(initialSort));
  }, [initialSort]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) =>
      sortOrder === "price-asc"
        ? a.priceCents - b.priceCents
        : b.priceCents - a.priceCents,
    );
  }, [products, sortOrder]);

  const updateHistory = useCallback((value: "price-asc" | "price-desc") => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("sort", value);
    const nextPath = `${url.pathname}${url.search}${url.hash}`;
    if (window.location.href === `${window.location.origin}${nextPath}`) {
      window.history.replaceState({ sort: value }, "", nextPath);
    } else {
      window.history.pushState({ sort: value }, "", nextPath);
    }
  }, []);

  const handleSortChange = useCallback(
    (value: "price-asc" | "price-desc") => {
      if (value === sortOrder) return;
      setSortOrder(value);
      updateHistory(value);
    },
    [sortOrder, updateHistory],
  );

  useEffect(() => {
    const handlePopState = () => {
      setSortOrder(getSortFromLocation(initialSort));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialSort]);

  return (
    <section id="product-list" className="space-y-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {dictionary.home.allProductsEyebrow}
          </span>
          <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
            {dictionary.home.allProductsTitle}
          </h2>
          <p className="max-w-2xl text-neutral-600">
            {dictionary.home.allProductsDescription}
          </p>
        </div>
        <ProductSortControl
          sortLabel={dictionary.catalog.sortLabel}
          ascLabel={dictionary.catalog.priceSort.asc}
          descLabel={dictionary.catalog.priceSort.desc}
          initialSort={initialSort}
          value={sortOrder}
          onValueChange={handleSortChange}
        />
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            dictionary={dictionary}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
