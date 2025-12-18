import { siteConfig } from "@/config/site";
import { getEffectivePriceCents } from "@/lib/utils/pricing";

export type CartItemLike = {
  productId: number;
  quantity: number;
};

export type CartProductLike = {
  id: number;
  priceCents: number;
  discountEnabled?: boolean;
  discountPercent?: number;
  effectivePriceCents?: number;
};

export type CartTotals = {
  itemsSubtotalCents: number;
  discountCents: number;
  deliveryCents: number;
  totalCents: number;
  vatCents: number;
};

export const calculateCartTotals = (
  items: CartItemLike[],
  products: CartProductLike[],
): CartTotals => {
  const freeShippingThresholdCents = siteConfig.freeShippingThreshold * 100;
  const priceMap = new Map(
    products.map((product) => [
      product.id,
      typeof product.effectivePriceCents === "number"
        ? product.effectivePriceCents
        : getEffectivePriceCents(product),
    ]),
  );
  let subtotal = 0;
  let bottleCount = 0;

  for (const item of items) {
    const price = priceMap.get(item.productId);
    if (typeof price !== "number") {
      continue;
    }

    subtotal += price * item.quantity;
    bottleCount += item.quantity;
  }

  const discountCents = bottleCount >= 10 ? Math.round(subtotal * 0.05) : 0;
  const discountedSubtotal = subtotal - discountCents;

  let deliveryCents = 0;
  if (discountedSubtotal < freeShippingThresholdCents) {
    deliveryCents = bottleCount <= 2 ? 600 : 800;
  }

  const totalCents = discountedSubtotal + deliveryCents;
  const vatCents = Math.round(totalCents - totalCents / 1.23);

  return {
    itemsSubtotalCents: subtotal,
    discountCents,
    deliveryCents,
    totalCents,
    vatCents,
  };
};
