import type { Locale } from "@/config/site";

export type ProductCategorySlug = "licor" | "aguardente" | "bebida-espiritosa";

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
};

export type ProductListItem = Pick<
  Product,
  "id" | "slug" | "category" | "image" | "priceCents" | "name"
> & {
  description: string;
};
