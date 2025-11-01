import type { Prisma, Product as PrismaProduct } from "@prisma/client";
import type { Locale } from "@/config/site";
import { prisma } from "@/lib/server/db";
import type {
  Product,
  ProductCategorySlug,
  ProductDetails,
  ProductListItem,
} from "@/types/product";

type ProductFilters = {
  category?: ProductCategorySlug | string;
  query?: string;
  sort?: "price-asc" | "price-desc";
  includeInactive?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const defaultDetails = (): ProductDetails => ({
  region: { en: "", pt: "" },
  base: { en: "", pt: "" },
  type: { en: "", pt: "" },
  bottleSize: { en: "", pt: "" },
  servingTemperature: { en: "", pt: "" },
  alcoholContent: { en: "", pt: "" },
  awards: { en: [], pt: [] },
});

const toLocaleStringRecord = (value: unknown, fallback = ""): Record<Locale, string> => {
  if (!isRecord(value)) {
    return { en: fallback, pt: fallback };
  }
  return {
    en: typeof value.en === "string" ? value.en : fallback,
    pt: typeof value.pt === "string" ? value.pt : fallback,
  };
};

const toLocaleStringArrayRecord = (value: unknown): Record<Locale, string[]> => {
  if (!isRecord(value)) {
    return { en: [], pt: [] };
  }
  const normalize = (input: unknown) =>
    Array.isArray(input)
      ? input.filter((item): item is string => typeof item === "string")
      : [];

  return {
    en: normalize(value.en),
    pt: normalize(value.pt),
  };
};

const deserializeDetails = (value: Prisma.JsonValue | null): ProductDetails => {
  if (!isRecord(value)) {
    return defaultDetails();
  }
  return {
    region: toLocaleStringRecord(value.region, ""),
    base: toLocaleStringRecord(value.base, ""),
    type: toLocaleStringRecord(value.type, ""),
    bottleSize: toLocaleStringRecord(value.bottleSize, ""),
    servingTemperature: toLocaleStringRecord(value.servingTemperature, ""),
    alcoholContent: toLocaleStringRecord(value.alcoholContent, ""),
    awards: toLocaleStringArrayRecord(value.awards),
  };
};

const summarizeDescription = (raw: string): string => {
  const summary = raw
    .split(/\n{2,}|\r?\n/)
    .find((paragraph) => paragraph.trim().length > 0);

  return (summary ?? raw).replace(/\s+/g, " ").trim();
};

const pickLocalized = (enValue: string, ptValue: string, locale: Locale) => {
  if (locale === "pt") {
    return ptValue?.trim().length ? ptValue : enValue;
  }

  return enValue?.trim().length ? enValue : ptValue;
};

const toListItem = (product: PrismaProduct, locale: Locale): ProductListItem => {
  const description = pickLocalized(product.descriptionEn, product.descriptionPt, locale);

  return {
    id: product.id,
    slug: product.slug,
    category: product.category as ProductCategorySlug,
    image: product.image,
    galleryImages: product.galleryImages,
    priceCents: product.priceCents,
    name: product.name,
    description: summarizeDescription(description),
    volumeMl: product.volumeMl,
    abv: product.abv,
    isActive: product.isActive,
  };
};

const toProduct = (product: PrismaProduct): Product => ({
  id: product.id,
  slug: product.slug,
  category: product.category as ProductCategorySlug,
  name: product.name,
  priceCents: product.priceCents,
  image: product.image,
  galleryImages: product.galleryImages,
  volumeMl: product.volumeMl,
  abv: product.abv,
  stock: product.stock,
  isActive: product.isActive,
  description: {
    en: product.descriptionEn,
    pt: product.descriptionPt,
  },
  tastingNotes: {
    en: product.tastingNotesEn ?? null,
    pt: product.tastingNotesPt ?? null,
  },
  details: deserializeDetails(product.details),
});

export const getAllProducts = async (locale: Locale, filters: ProductFilters = {}) => {
  const where: Prisma.ProductWhereInput = {
    ...(filters.includeInactive ? {} : { isActive: true }),
    ...(filters.category
      ? {
          category: filters.category,
        }
      : {}),
    ...(filters.query
      ? {
          OR: [
            { name: { contains: filters.query, mode: "insensitive" } },
            { descriptionEn: { contains: filters.query, mode: "insensitive" } },
            { descriptionPt: { contains: filters.query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const orderBy =
    filters.sort === "price-asc"
      ? { priceCents: "asc" as const }
      : filters.sort === "price-desc"
        ? { priceCents: "desc" as const }
        : { name: "asc" as const };

  const products = await prisma.product.findMany({
    where,
    orderBy,
  });

  return products.map((product) => toListItem(product, locale));
};

export const getProductsByIds = async (ids: number[]) => {
  if (!ids.length) {
    return [] as Product[];
  }
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });
  return products.map(toProduct);
};

export const getProductSummariesByIds = async (ids: number[], locale: Locale) => {
  if (!ids.length) {
    return [] as ProductListItem[];
  }
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
  });
  return products.map((product) => toListItem(product, locale));
};

export const getAllProductSlugs = async () => {
  const products = await prisma.product.findMany({
    select: { slug: true },
    where: { isActive: true },
  });
  return products.map((product) => product.slug);
};

export const getProductBySlug = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
  });
  return product ? toProduct(product) : null;
};

export const getRelatedProducts = async (slug: string, locale: Locale, limit = 4) => {
  const current = await prisma.product.findUnique({
    where: { slug },
  });

  if (!current) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: { not: current.id },
      category: current.category,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return products.map((product) => toListItem(product, locale));
};

export const getFeaturedProducts = async (locale: Locale, limit = 4) => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (!products.length) {
    const fallback = await prisma.product.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { name: "asc" },
    });
    return fallback.map((product) => toListItem(product, locale));
  }

  return products.map((product) => toListItem(product, locale));
};
