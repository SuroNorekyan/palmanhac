import type { Locale } from "@/config/site";

export type ProductCategorySlug = "licor" | "aguardente";

export type ProductDetails = {
  region: Record<Locale, string>;
  base: Record<Locale, string>;
  type: Record<Locale, string>;
  bottleSize: Record<Locale, string>;
  servingTemperature: Record<Locale, string>;
  alcoholContent: Record<Locale, string>;
  awards: Record<Locale, string[]>;
};

export type Product = {
  id: number;
  slug: string;
  category: ProductCategorySlug;
  name: string;
  priceCents: number;
  image: string;
  volumeMl: number;
  abv: number;
  description: Record<Locale, string>;
  details: ProductDetails;
};

export type ProductListItem = {
  id: number;
  slug: string;
  category: ProductCategorySlug;
  image: string;
  priceCents: number;
  name: string;
  description: string;
  volumeMl: number;
  abv: number;
};
