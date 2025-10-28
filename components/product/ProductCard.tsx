"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { IconButton } from "@/components/common/IconButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/lib/store/cart";
import { useFavoritesStore } from "@/lib/store/favorites";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/format";
import { withLocale } from "@/lib/utils/locale";
import type { ProductListItem } from "@/types/product";

export type ProductCardProps = {
  product: ProductListItem;
  dictionary: Dictionary;
  locale: Locale;
};

export function ProductCard({ product, dictionary, locale }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addItem);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const isFavorite = useFavoritesStore((state) => state.has(product.id));
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product.id, 1);
    toast({
      title: dictionary.product.addToCart,
      description: `${product.name} • ${formatCurrency(locale, product.priceCents)}`,
      variant: "success",
    });
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product.id);
    toast({
      title: isFavorite
        ? dictionary.product.removeFromFavorites
        : dictionary.product.addToFavorites,
      description: product.name,
    });
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden bg-white">
      <Link
        href={withLocale(locale, `/product/${product.slug}`)}
        className="relative block overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.name}
          width={480}
          height={480}
          className="h-64 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge variant="muted" className="uppercase">
            {product.category.replace("-", " ")}
          </Badge>
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <Link
              href={withLocale(locale, `/product/${product.slug}`)}
              className="text-lg font-semibold text-neutral-900"
            >
              {product.name}
            </Link>
            <span className="text-sm font-semibold text-neutral-600">
              {formatCurrency(locale, product.priceCents)}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-neutral-500">{product.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button onClick={handleAddToCart} className="flex-1">
            {dictionary.product.addToCart}
          </Button>
          <IconButton
            icon={
              <Heart
                className={cn("h-5 w-5", isFavorite && "fill-red-500 text-red-500")}
              />
            }
            onClick={handleToggleFavorite}
            srLabel={dictionary.product.addToFavorites}
            className="border-0 bg-neutral-100 text-neutral-600 hover:bg-neutral-900 hover:text-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}
