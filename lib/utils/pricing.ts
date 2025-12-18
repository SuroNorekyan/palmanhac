export type PriceLike = {
  priceCents: number;
  discountEnabled?: boolean | null;
  discountPercent?: number | null;
};

export const clampDiscountPercent = (percent: number | null | undefined) => {
  if (typeof percent !== "number" || Number.isNaN(percent)) {
    return 0;
  }
  return Math.min(Math.max(Math.trunc(percent), 0), 99);
};

export const hasDiscount = (input: PriceLike) =>
  Boolean(input.discountEnabled && clampDiscountPercent(input.discountPercent) > 0);

export const getEffectivePriceCents = (input: PriceLike): number => {
  const base = Number.isFinite(input.priceCents) ? input.priceCents : 0;
  if (!hasDiscount(input)) {
    return Math.max(0, Math.round(base));
  }
  const percent = clampDiscountPercent(input.discountPercent);
  const discounted = (base * (100 - percent)) / 100;
  return Math.max(0, Math.round(discounted));
};

export const getDiscountLabel = (percent: number | null | undefined) => {
  const value = clampDiscountPercent(percent);
  return value > 0 ? `${value}%` : null;
};
