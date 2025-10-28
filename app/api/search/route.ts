import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "@/config/site";
import { getAllProducts } from "@/lib/server/products";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? defaultLocale;
  const locale = locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : defaultLocale;
  const query = searchParams.get("q") ?? undefined;
  const sortParam = searchParams.get("sort") ?? undefined;
  const sort =
    sortParam === "price-desc" || sortParam === "price-asc" ? sortParam : undefined;

  const products = await getAllProducts(locale, { query, sort });

  return NextResponse.json({ products });
}
