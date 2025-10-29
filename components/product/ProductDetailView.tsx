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
  region: string;
  base: string;
  type: string;
  alcoholContent: string;
  bottleSize: string;
  servingTemperature: string;
  awards: string[];
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
  const infoItems = [
    {
      key: "region",
      label: dictionary.product.details.region,
      value: product.region,
    },
    {
      key: "base",
      label: dictionary.product.details.base,
      value: product.base,
    },
    {
      key: "type",
      label: dictionary.product.details.type,
      value: product.type,
    },
    {
      key: "alcohol",
      label: dictionary.product.details.alcoholContent,
      value: product.alcoholContent || `${product.abv}%`,
    },
    {
      key: "bottle",
      label: dictionary.product.details.bottleSize,
      value: product.bottleSize || `${product.volumeMl} ml`,
    },
    {
      key: "serving",
      label: dictionary.product.details.servingTemperature,
      value: product.servingTemperature,
    },
  ].filter((item) => item.value && item.value.trim().length);

  return (
    <div className="space-y-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-[0px_24px_65px_rgba(15,23,42,0.12)]">
          <div className="relative h-[380px] overflow-hidden rounded-[2rem] bg-neutral-50 sm:h-[440px] lg:h-[520px]">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
              className="object-contain"
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
          {infoItems.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {infoItems.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4 shadow-sm"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {item.label}
                  </span>
                  <p className="mt-1 text-sm text-neutral-700">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}
          {product.awards.length ? (
            <div className="space-y-3 rounded-3xl border border-dashed border-[rgb(var(--border))] bg-white/80 p-5">
              <h2 className="text-lg font-semibold text-neutral-900">
                {dictionary.product.details.awards}
              </h2>
              <ul className="space-y-2 text-sm text-neutral-600">
                {product.awards.map((award) => (
                  <li key={award} className="flex items-start gap-2">
                    <span aria-hidden className="mt-[3px] text-neutral-400">
                      •
                    </span>
                    <span>{award}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
