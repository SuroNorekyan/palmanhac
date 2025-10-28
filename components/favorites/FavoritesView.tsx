"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/lib/store/cart";
import { useFavoritesStore } from "@/lib/store/favorites";
import { withLocale } from "@/lib/utils/locale";
import type { ProductListItem } from "@/types/product";

export function FavoritesView({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  const ids = useFavoritesStore((state) => state.ids);
  const clearFavorites = useFavoritesStore((state) => state.clear);
  const { toast } = useToast();
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<ProductListItem[]>([]);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
    }
  }, [ids.length]);

  useEffect(() => {
    if (!ids.length) {
      return;
    }
    const controller = new AbortController();
    fetch(`/api/products?ids=${ids.join(",")}&locale=${locale}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load favorites");
        }
        const data = (await res.json()) as { products: ProductListItem[] };
        setProducts(data.products);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      });

    return () => controller.abort();
  }, [ids, locale]);

  const addAllToCart = () => {
    ids.forEach((id) => addItem(id, 1));
    toast({ title: dictionary.favorites.moveToCart, variant: "success" });
  };

  if (!ids.length) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4 text-center">
        <Image
          src="/assets/palmanhac-licor-limao.png"
          alt="Favorites"
          width={200}
          height={200}
          className="rounded-3xl object-cover opacity-90"
        />
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.favorites.heading}
        </h1>
        <p className="max-w-md text-neutral-500">{dictionary.favorites.empty}</p>
        <Button asChild>
          <Link href={withLocale(locale, "/licor")}>
            {dictionary.cart.continueShopping}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={addAllToCart}>{dictionary.favorites.moveToCart}</Button>
        <Button variant="ghost" onClick={clearFavorites}>
          {dictionary.favorites.clear}
        </Button>
      </div>
      <ProductGrid products={products} dictionary={dictionary} locale={locale} />
    </div>
  );
}
