import type { Locale } from "@/config/site";

export type ProductCategorySlug = "licor" | "aguardente" | "bebida-espirituosa";

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
  galleryImages: string[];
  volumeMl: number;
  abv: number;
  stock: number;
  isActive: boolean;
  description: Record<Locale, string>;
  tastingNotes?: Record<Locale, string | null>;
  details: ProductDetails;
};

export type ProductListItem = {
  id: number;
  slug: string;
  category: ProductCategorySlug;
  image: string;
  galleryImages: string[];
  priceCents: number;
  name: string;
  description: string;
  volumeMl: number;
  abv: number;
  isActive: boolean;
};
