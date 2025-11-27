import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "@/config/site";
import { getProductBySlug } from "@/lib/server/products";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? defaultLocale;
  const locale = locales.includes(localeParam as Locale)
    ? (localeParam as Locale)
    : defaultLocale;

  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  return NextResponse.json({
    product: {
      id: product.id,
      slug: product.slug,
      image: product.image,
      priceCents: product.priceCents,
      category: product.category,
      volumeMl: product.volumeMl,
      vol: product.vol,
      name: product.name,
      description: product.description[locale] ?? product.description[defaultLocale],
      descriptionEn: product.description.en,
      descriptionPt: product.description.pt,
    },
  });
}
