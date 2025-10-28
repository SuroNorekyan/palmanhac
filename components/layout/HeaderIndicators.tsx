"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { IconButton } from "@/components/common/IconButton";
import type { Locale } from "@/config/site";
import { useCartStore } from "@/lib/store/cart";
import { useFavoritesStore } from "@/lib/store/favorites";
import { withLocale } from "@/lib/utils/locale";

export function CartIndicator({ label, locale }: { label: string; locale: Locale }) {
  const count = useCartStore((state) => state.totalItems());

  return (
    <Link href={withLocale(locale, "/cart")} className="inline-flex">
      <IconButton
        icon={<ShoppingBag className="h-5 w-5" />}
        badgeContent={count}
        srLabel={label}
      />
    </Link>
  );
}

export function FavoritesIndicator({ label, locale }: { label: string; locale: Locale }) {
  const favoritesCount = useFavoritesStore((state) => state.ids.length);

  return (
    <Link href={withLocale(locale, "/favorites")} className="inline-flex">
      <IconButton
        icon={<Heart className="h-5 w-5" />}
        badgeContent={favoritesCount}
        srLabel={label}
      />
    </Link>
  );
}
