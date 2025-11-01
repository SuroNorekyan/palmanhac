export type CartItemLike = {
  productId: number;
  quantity: number;
};

export type CartProductLike = {
  id: number;
  priceCents: number;
};

export type CartTotals = {
  itemsSubtotalCents: number;
  discountCents: number;
  deliveryCents: number;
  totalCents: number;
  vatAmount: number;
};

export const calculateCartTotals = (
  items: CartItemLike[],
  products: CartProductLike[],
): CartTotals => {
  const priceMap = new Map(products.map((product) => [product.id, product.priceCents]));
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
  if (discountedSubtotal < 5000) {
    deliveryCents = bottleCount <= 2 ? 600 : 800;
  }

  const totalCents = discountedSubtotal + deliveryCents;
  const vatAmount = totalCents / 100 - totalCents / (100 * 1.23);

  return {
    itemsSubtotalCents: subtotal,
    discountCents,
    deliveryCents,
    totalCents,
    vatAmount,
  };
};
