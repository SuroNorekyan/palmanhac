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
    <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
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
