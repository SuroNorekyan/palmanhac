import { Suspense } from "react";
import { ProductFilters } from "@/components/product/ProductFilters";
import { ProductGrid } from "@/components/product/ProductGrid";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getAllProducts } from "@/lib/server/products";

export default async function AguardentePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string; sort?: string }>;
}) {
  const locale = await extractLocale(params);
  const resolvedSearch = (await searchParams) ?? {};
  const dictionary = getDictionary(locale);
  const products = await getAllProducts(locale, {
    category: "aguardente",
    query: resolvedSearch.q,
    sort: resolvedSearch.sort === "price-desc" ? "price-desc" : "price-asc",
  });
  const heading = dictionary.home.categories.aguardente;

  return (
    <section className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold text-neutral-900">{heading}</h1>
        <p className="text-neutral-500">{dictionary.home.featuredDescription}</p>
      </header>
      <Suspense
        fallback={
          <div className="h-12 w-full animate-pulse rounded-2xl bg-neutral-100" />
        }
      >
        <ProductFilters dictionary={dictionary} />
      </Suspense>
      <ProductGrid products={products} dictionary={dictionary} locale={locale} />
    </section>
  );
}
