import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { defaultLocale, locales, resolveLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/server/products";

export const dynamicParams = true;
export const revalidate = 0;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  const locale = resolveLocale(localeParam);
  const dictionary = getDictionary(locale);
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const localizedDescriptionValue = product.description[locale]?.trim().length
    ? product.description[locale]
    : product.description[defaultLocale];

  if (!localizedDescriptionValue) {
    notFound();
  }

  const localizedName =
    locale === "pt"
      ? product.namePt?.trim().length
        ? product.namePt
        : product.name
      : product.name?.trim().length
        ? product.name
        : product.namePt;

  const withFallback = (value: string | undefined, fallback: string | undefined) =>
    value && value.trim().length ? value : (fallback ?? "");

  const localizedDetails = {
    region: withFallback(
      product.details.region[locale],
      product.details.region[defaultLocale],
    ),
    base: withFallback(product.details.base[locale], product.details.base[defaultLocale]),
    type: withFallback(product.details.type[locale], product.details.type[defaultLocale]),
    alcoholContent: withFallback(
      product.details.alcoholContent[locale],
      product.details.alcoholContent[defaultLocale] ?? `${product.vol}%`,
    ),
    bottleSize: withFallback(
      product.details.bottleSize[locale],
      product.details.bottleSize[defaultLocale] ?? `${product.volumeMl} ml`,
    ),
    servingTemperature: withFallback(
      product.details.servingTemperature[locale],
      product.details.servingTemperature[defaultLocale],
    ),
    awards: product.details.awards[locale]?.length
      ? product.details.awards[locale]
      : (product.details.awards[defaultLocale] ?? []),
  };

  const detail = {
    id: product.id,
    slug: product.slug,
    name: localizedName,
    description: localizedDescriptionValue,
    image: product.image,
    priceCents: product.priceCents,
    effectivePriceCents: product.effectivePriceCents,
    discountEnabled: product.discountEnabled,
    discountPercent: product.discountPercent,
    category: product.category,
    volumeMl: product.volumeMl,
    vol: product.vol,
    region: localizedDetails.region,
    base: localizedDetails.base,
    type: localizedDetails.type,
    alcoholContent: localizedDetails.alcoholContent,
    bottleSize: localizedDetails.bottleSize,
    servingTemperature: localizedDetails.servingTemperature,
    awards: localizedDetails.awards,
  } satisfies Parameters<typeof ProductDetailView>[0]["product"];

  const related = await getRelatedProducts(product.slug, locale, 3);

  return (
    <ProductDetailView
      product={detail}
      related={related}
      dictionary={dictionary}
      locale={locale}
    />
  );
}
