import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { ProductListItem } from "@/types/product";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  dictionary,
  locale,
}: {
  products: ProductListItem[];
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          dictionary={dictionary}
          locale={locale}
        />
      ))}
    </div>
  );
}
