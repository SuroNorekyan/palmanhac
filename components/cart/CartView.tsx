"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { Locale } from "@/config/site";
import { useAnonCartImport } from "@/lib/hooks/useAnonCartImport";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/lib/store/cart";
import { useFavoritesStore } from "@/lib/store/favorites";
import { calculateCartTotals } from "@/lib/utils/cart-totals";
import { formatCurrency } from "@/lib/utils/currency";
import { withLocale } from "@/lib/utils/locale";
import type { ProductListItem } from "@/types/product";

type CartProduct = ProductListItem & {
  slug: string;
  priceCents: number;
  image: string;
};

export function CartView({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session, status } = useSession();
  const lastIdentityRef = useRef<string | null>(null);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clear);
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useAnonCartImport({ status, userId: session?.user?.id });

  useEffect(() => {
    const currentIdentity =
      status === "authenticated" && session?.user?.id ? session.user.id : "anon";

    if (lastIdentityRef.current === null) {
      lastIdentityRef.current = currentIdentity;
      return;
    }

    if (lastIdentityRef.current !== currentIdentity) {
      useCartStore.getState().clear();
      useFavoritesStore.getState().clear();
      setProducts([]);
      setLoading(false);
    }

    lastIdentityRef.current = currentIdentity;
  }, [session?.user?.id, status]);

  const { itemsSubtotalCents, discountCents, deliveryCents, totalCents, vatCents } =
    useMemo(() => calculateCartTotals(items, products), [items, products]);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
    }
  }, [items.length]);

  useEffect(() => {
    const ids = items.map((item) => item.productId);
    if (!ids.length) {
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    fetch(`/api/products?ids=${ids.join(",")}&locale=${locale}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        const data = (await res.json()) as { products: CartProduct[] };
        setProducts(data.products);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [items, locale]);

  const onAddFavoritesToCart = () => {
    favoriteIds.forEach((id) => addItem(id, 1));
    toast({
      title: dictionary.cart.addAllFavorites,
      variant: "success",
    });
  };

  const handleCheckout = () => {
    router.push(withLocale(locale, "/checkout"));
  };

  if (!items.length) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4 text-center">
        <Image
          src="/assets/palmanhac-licor-cafe.png"
          alt="Empty cart"
          width={200}
          height={200}
          className="rounded-3xl object-cover opacity-80"
        />
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.cart.heading}
        </h1>
        <p className="max-w-md text-neutral-500">{dictionary.cart.empty}</p>
        <Button asChild>
          <Link href={withLocale(locale, "/licor")}>
            {dictionary.cart.continueShopping}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        {items.map((item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          if (!product) {
            return (
              <div
                key={item.productId}
                className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm"
              >
                <div className="animate-pulse h-24 rounded-xl bg-neutral-100" />
              </div>
            );
          }

          return (
            <div
              key={product.id}
              className="flex flex-col gap-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-neutral-50">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <Link
                    href={withLocale(locale, `/product/${product.slug}`)}
                    className="text-lg font-semibold text-neutral-900"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-neutral-500">{product.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center">
                <QuantitySelector
                  value={item.quantity}
                  onChange={(value) => updateQuantity(product.id, value)}
                />
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(locale, product.priceCents * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    className="text-xs text-neutral-500 hover:text-neutral-800"
                  >
                    {dictionary.cart.remove}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <aside className="space-y-6 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-neutral-900">
          {dictionary.cart.heading}
        </h2>
        <div className="space-y-2 text-sm font-medium">
          <div className="flex items-center justify-between">
            <span>{dictionary.cart.subtotal}</span>
            <span>{formatCurrency(locale, itemsSubtotalCents)}</span>
          </div>
          {discountCents > 0 ? (
            <div className="flex items-center justify-between text-emerald-600">
              <span>{dictionary.cart.discount}</span>
              <span>-{formatCurrency(locale, discountCents)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span>{dictionary.cart.delivery}</span>
            <span>{formatCurrency(locale, deliveryCents)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span>{dictionary.cart.total}</span>
            <span>{formatCurrency(locale, totalCents)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{dictionary.cart.vatIncluded}</span>
            <span>{formatCurrency(locale, vatCents)}</span>
          </div>
        </div>
        <Button size="lg" className="w-full" onClick={handleCheckout}>
          {dictionary.cart.checkout}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            clearCart();
            toast({ title: dictionary.cart.cleared });
          }}
        >
          {dictionary.cart.clearButton}
        </Button>
        {favoriteIds.length ? (
          <Button variant="outline" className="w-full" onClick={onAddFavoritesToCart}>
            {dictionary.cart.addAllFavorites}
          </Button>
        ) : null}
        {loading ? <p className="text-xs text-neutral-400">Loading...</p> : null}
      </aside>
    </div>
  );
}
