"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  const { data: session, status } = useSession();
  const lastIdentityRef = useRef<string | null>(null);
  const ids = useFavoritesStore((state) => state.ids);
  const clearFavorites = useFavoritesStore((state) => state.clear);
  const setAllFavorites = useFavoritesStore((state) => state.setAll);
  const { toast } = useToast();
  const addItem = useCartStore((state) => state.addItem);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
    }
  }, [ids.length]);

  useEffect(() => {
    const currentIdentity =
      status === "authenticated" && session?.user?.id ? session.user.id : "anon";

    if (lastIdentityRef.current === null) {
      lastIdentityRef.current = currentIdentity;
      return;
    }

    if (lastIdentityRef.current !== currentIdentity) {
      useFavoritesStore.getState().clear();
      useCartStore.getState().clear();
      setProducts([]);
      setHasSynced(false);
    }

    lastIdentityRef.current = currentIdentity;
  }, [session?.user?.id, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      setHasSynced(false);
      if (!ids.length) {
        setProducts([]);
        return undefined;
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
    }
    return undefined;
  }, [ids, locale, status]);

  const loadServerFavorites = async (showToast = false) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/favorites", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load favorites");
      }
      const payload = (await response.json()) as {
        favorites: {
          id: string;
          product: ProductListItem;
        }[];
      };
      const list = payload.favorites.map((item) => item.product);
      setProducts(list);
      setAllFavorites(list.map((item) => item.id));
      if (showToast) {
        toast({ title: dictionary.favorites.synced, variant: "success" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setHasSynced(false);
      return;
    }

    if (!hasSynced) {
      (async () => {
        await loadServerFavorites(false);
        setHasSynced(true);
      })();
      return;
    }

    void loadServerFavorites(false);
  }, [status, session?.user?.id, hasSynced]);

  const addAllToCart = () => {
    const sourceIds = products.map((product) => product.id);
    sourceIds.forEach((id) => addItem(id, 1));
    toast({ title: dictionary.favorites.moveToCart, variant: "success" });
  };

  const handleClear = async () => {
    if (status === "authenticated") {
      await Promise.all(
        products.map((product) =>
          fetch("/api/favorites", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id }),
          }).catch(() => undefined),
        ),
      );
      await loadServerFavorites(false);
    }
    clearFavorites();
    setProducts([]);
  };

  const emptyState =
    !isLoading && !products.length && (status !== "authenticated" ? !ids.length : true);

  if (emptyState) {
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
        <Button variant="ghost" onClick={handleClear} disabled={isLoading}>
          {dictionary.favorites.clear}
        </Button>
      </div>
      <ProductGrid products={products} dictionary={dictionary} locale={locale} />
    </div>
  );
}
