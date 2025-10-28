import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "@/config/site";
import { getAllProducts, getProductSummariesByIds } from "@/lib/server/products";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? defaultLocale;
  const locale = locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : defaultLocale;
  const idsParam = searchParams.get("ids");
  const query = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const sortParam = searchParams.get("sort") ?? undefined;
  const sort =
    sortParam === "price-desc" || sortParam === "price-asc" ? sortParam : undefined;

  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((id) => Number.parseInt(id, 10))
      .filter(Number.isFinite);
    const products = await getProductSummariesByIds(ids, locale);
    return NextResponse.json({ products });
  }

  const products = await getAllProducts(locale, {
    category: category ?? undefined,
    query,
    sort,
  });

  return NextResponse.json({ products });
}
