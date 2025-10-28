import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { defaultLocale, locales, resolveLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/server/products";

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

  const localizedDescription =
    product.description[locale] ?? product.description[defaultLocale];

  if (!localizedDescription) {
    notFound();
  }

  const detail = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: localizedDescription,
    image: product.image,
    priceCents: product.priceCents,
    category: product.category,
    volumeMl: product.volumeMl,
    abv: product.abv,
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
