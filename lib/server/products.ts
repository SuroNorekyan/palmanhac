import { defaultLocale } from "@/config/site";
import type { Locale } from "@/config/site";
import { parseMockItems, type ParsedMockItem } from "@/lib/data/mockItemParser";
import type { Product, ProductCategorySlug, ProductListItem } from "@/types/product";

type ProductFilters = {
  category?: ProductCategorySlug;
  query?: string;
  sort?: "price-asc" | "price-desc";
};

let cache: ParsedMockItem[] | null = null;

const loadProducts = async (): Promise<ParsedMockItem[]> => {
  if (cache) {
    return cache;
  }
  cache = await parseMockItems();
  return cache;
};

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const matchesQuery = (item: ParsedMockItem, query: string) => {
  const normalized = normalizeSearch(query.trim());
  if (!normalized.length) {
    return true;
  }

  const haystacks = [item.name, item.description.en, item.description.pt].map((text) =>
    normalizeSearch(text),
  );

  return haystacks.some((text) => text.includes(normalized));
};

const sortProducts = (
  items: ParsedMockItem[],
  sort: ProductFilters["sort"],
): ParsedMockItem[] => {
  const cloned = [...items];
  if (sort === "price-asc") {
    cloned.sort((a, b) => a.priceCents - b.priceCents);
    return cloned;
  }
  if (sort === "price-desc") {
    cloned.sort((a, b) => b.priceCents - a.priceCents);
    return cloned;
  }
  cloned.sort((a, b) => a.name.localeCompare(b.name));
  return cloned;
};

const summarizeDescription = (item: ParsedMockItem, locale: Locale) => {
  const raw = item.description[locale] ?? item.description[defaultLocale];
  const summary =
    raw.split(/\n{2,}|\r?\n/).find((paragraph) => paragraph.trim().length) ?? raw;
  return summary.replace(/\s+/g, " ").trim();
};

const toListItem = (item: ParsedMockItem, locale: Locale): ProductListItem => ({
  id: item.id,
  slug: item.slug,
  category: item.category,
  image: item.image,
  priceCents: item.priceCents,
  name: item.name,
  description: summarizeDescription(item, locale),
  volumeMl: item.volumeMl,
  abv: item.abv,
});

const toProduct = (item: ParsedMockItem): Product => ({
  id: item.id,
  slug: item.slug,
  category: item.category,
  name: item.name,
  priceCents: item.priceCents,
  image: item.image,
  volumeMl: item.volumeMl,
  abv: item.abv,
  description: item.description,
  details: item.details,
});

export const getAllProducts = async (locale: Locale, filters: ProductFilters = {}) => {
  const items = await loadProducts();
  const filtered = items.filter((item) => {
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    if (filters.query && !matchesQuery(item, filters.query)) {
      return false;
    }
    return true;
  });

  return sortProducts(filtered, filters.sort).map((item) => toListItem(item, locale));
};

export const getProductsByIds = async (ids: number[]) => {
  if (!ids.length) {
    return [] as Product[];
  }
  const items = await loadProducts();
  return items.filter((item) => ids.includes(item.id)).map(toProduct);
};

export const getProductSummariesByIds = async (ids: number[], locale: Locale) => {
  if (!ids.length) {
    return [] as ProductListItem[];
  }
  const items = await loadProducts();
  return items
    .filter((item) => ids.includes(item.id))
    .map((item) => toListItem(item, locale));
};

export const getAllProductSlugs = async () => {
  const items = await loadProducts();
  return items.map((item) => item.slug);
};

export const getProductBySlug = async (slug: string) => {
  const items = await loadProducts();
  const match = items.find((item) => item.slug === slug);
  return match ? toProduct(match) : null;
};

export const getRelatedProducts = async (slug: string, locale: Locale, limit = 4) => {
  const items = await loadProducts();
  const current = items.find((item) => item.slug === slug);
  if (!current) {
    return [];
  }

  const related = items.filter(
    (item) => item.slug !== slug && item.category === current.category,
  );

  return related.slice(0, limit).map((item) => toListItem(item, locale));
};

export const getFeaturedProducts = async (locale: Locale, limit = 4) => {
  const items = await loadProducts();
  return sortProducts(items, undefined)
    .slice(0, limit)
    .map((item) => toListItem(item, locale));
};
