"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductGrid } from "@/components/product/ProductGrid";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/lib/store/cart";
import { useFavoritesStore } from "@/lib/store/favorites";
import { formatCurrency } from "@/lib/utils/currency";
import type { ProductListItem } from "@/types/product";

export interface ProductDetailData {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  priceCents: number;
  category: string;
  volumeMl: number;
  abv: number;
}

export function ProductDetailView({
  product,
  related,
  dictionary,
  locale,
}: {
  product: ProductDetailData;
  related: ProductListItem[];
  dictionary: Dictionary;
  locale: Locale;
}) {
  const { toast } = useToast();
  const addItem = useCartStore((state) => state.addItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = useFavoritesStore((state) => state.has(product.id));
  const [quantity, setQuantity] = useState(1);

  const descriptionParagraphs = product.description
    .split(/\n{2,}|\r?\n\r?\n?/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const intro = descriptionParagraphs[0] ?? "";
  const additionalParagraphs = descriptionParagraphs.slice(1);

  return (
    <div className="space-y-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-[0px_24px_65px_rgba(15,23,42,0.12)]">
          <div className="relative h-[520px] overflow-hidden rounded-[2rem] bg-neutral-50">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute left-10 top-10">
            <Badge variant="muted">{product.category.replace("-", " ")}</Badge>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-neutral-900">{product.name}</h1>
            {intro ? <p className="text-lg text-neutral-600">{intro}</p> : null}
            <div className="flex items-center gap-3 text-sm text-neutral-500">
              <span>{product.volumeMl} ml</span>
              <span>•</span>
              <span>{product.abv}% ABV</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <p className="text-3xl font-semibold text-neutral-900">
              {formatCurrency(locale, product.priceCents)}
            </p>
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              onClick={() => {
                addItem(product.id, quantity);
                toast({
                  title: dictionary.product.addToCart,
                  description: `${product.name} • ${formatCurrency(locale, product.priceCents * quantity)}`,
                  variant: "success",
                });
                setQuantity(1);
              }}
            >
              {dictionary.product.addToCart}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                toggleFavorite(product.id);
                toast({
                  title: isFavorite
                    ? dictionary.product.removeFromFavorites
                    : dictionary.product.addToFavorites,
                  description: product.name,
                });
              }}
            >
              {isFavorite
                ? dictionary.product.removeFromFavorites
                : dictionary.product.addToFavorites}
            </Button>
          </div>
          {additionalParagraphs.length ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                {dictionary.product.description}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-neutral-600">
                {additionalParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {related.length ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-neutral-900">
            {dictionary.product.relatedItems}
          </h2>
          <ProductGrid products={related} dictionary={dictionary} locale={locale} />
        </div>
      ) : null}
    </div>
  );
}
