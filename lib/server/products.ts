import type { Prisma } from "@prisma/client";
import type { Locale } from "@/config/site";
import type { Product, ProductListItem } from "@/types/product";
import { prisma } from "./db";

const productSelect = {
  id: true,
  slug: true,
  category: true,
  name: true,
  image: true,
  priceCents: true,
  volumeMl: true,
  abv: true,
  descriptionEn: true,
  descriptionPt: true,
} satisfies Prisma.ProductSelect;

type ProductEntity = Prisma.ProductGetPayload<{
  select: typeof productSelect;
}>;

const toProduct = (product: ProductEntity | null): Product | null => {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    slug: product.slug,
    category: product.category as Product["category"],
    name: product.name,
    priceCents: product.priceCents,
    image: product.image,
    volumeMl: product.volumeMl,
    abv: product.abv,
    description: {
      en: product.descriptionEn,
      pt: product.descriptionPt,
    },
  };
};

const toProductListItem = (product: ProductEntity, locale: Locale): ProductListItem => {
  const descriptionRaw = locale === "pt" ? product.descriptionPt : product.descriptionEn;
  const description =
    descriptionRaw.split(/\n{2,}|\r?\n/).find((paragraph) => paragraph.trim().length) ??
    descriptionRaw;

  return {
    id: product.id,
    slug: product.slug,
    category: product.category as Product["category"],
    image: product.image,
    priceCents: product.priceCents,
    name: product.name,
    description: description.replace(/\s+/g, " ").trim(),
  };
};

type ProductFilters = {
  category?: string;
  query?: string;
  sort?: "price-asc" | "price-desc";
};

const buildOrderBy = (sort?: ProductFilters["sort"]) => {
  if (sort === "price-asc") {
    return { priceCents: "asc" } as const;
  }
  if (sort === "price-desc") {
    return { priceCents: "desc" } as const;
  }
  return { createdAt: "asc" } as const;
};

export const getAllProducts = async (locale: Locale, filters: ProductFilters = {}) => {
  const { category, query, sort } = filters;

  const products = await prisma.product.findMany({
    where: {
      category: category ?? undefined,
      OR: query
        ? [
            { name: { contains: query, mode: "insensitive" } },
            { descriptionEn: { contains: query, mode: "insensitive" } },
            { descriptionPt: { contains: query, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: buildOrderBy(sort),
    select: productSelect,
  });

  return products.map((product) => toProductListItem(product, locale));
};

export const getProductsByIds = async (ids: number[]) => {
  if (!ids.length) return [] as Product[];

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: productSelect,
  });

  return products
    .map((product) => toProduct(product))
    .filter((product): product is Product => Boolean(product));
};

export const getProductSummariesByIds = async (ids: number[], locale: Locale) => {
  if (!ids.length) return [] as ProductListItem[];
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: ids,
      },
    },
    select: productSelect,
  });

  return products.map((product) => toProductListItem(product, locale));
};

export const getAllProductSlugs = async () => {
  const products = await prisma.product.findMany({
    select: { slug: true },
  });

  return products.map((product) => product.slug);
};

export const getProductBySlug = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: productSelect,
  });

  const normalized = toProduct(product);
  if (!normalized) {
    return null;
  }

  return normalized;
};

export const getRelatedProducts = async (slug: string, locale: Locale, limit = 4) => {
  const current = await getProductBySlug(slug);

  if (!current) {
    return [];
  }

  const related = await prisma.product.findMany({
    where: {
      category: current.category,
      slug: {
        not: slug,
      },
    },
    select: {
      id: true,
      slug: true,
      category: true,
      name: true,
      image: true,
      priceCents: true,
      volumeMl: true,
      abv: true,
      descriptionEn: true,
      descriptionPt: true,
    },
    take: limit,
  });

  return related.map((item) => toProductListItem(item, locale));
};

export const getFeaturedProducts = async (locale: Locale, limit = 4) => {
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
    select: {
      id: true,
      slug: true,
      category: true,
      name: true,
      image: true,
      priceCents: true,
      volumeMl: true,
      abv: true,
      descriptionEn: true,
      descriptionPt: true,
    },
  });

  return products.map((product) => toProductListItem(product, locale));
};
