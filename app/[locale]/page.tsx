import Image from "next/image";
import Link from "next/link";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedCarousel } from "@/components/product/FeaturedCarousel";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductSortControl } from "@/components/product/ProductSortControl";
import { Button } from "@/components/ui/button";
import { navConfig } from "@/config/nav";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getAllProducts, getFeaturedProducts } from "@/lib/server/products";
import { withLocale } from "@/lib/utils/locale";

const categoryImages: Record<string, string> = {
  licor: "/assets/palmanhac-licor-laranja.png",
  aguardente: "/assets/palmanhac-aguardente-morango.png",
};

const categorySlugMap: Record<string, string> = {
  licor: "licor",
  aguardente: "aguardente",
};

export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ sort?: string }>;
}) {
  const locale = await extractLocale(params);
  const resolvedSearch = (await searchParams) ?? {};
  const dictionary = getDictionary(locale);
  const sortParam = resolvedSearch.sort === "price-desc" ? "price-desc" : "price-asc";
  const [products, featured] = await Promise.all([
    getAllProducts(locale, { sort: sortParam }),
    getFeaturedProducts(locale, 8),
  ]);

  return (
    <div className="space-y-20">
      <HeroSection
        eyebrow={dictionary.home.heroEyebrow}
        heading={dictionary.home.heroHeading}
        subheading={dictionary.home.heroSubheading}
        ctaLabel={dictionary.home.exploreCollections}
        scrollTargetId="product-list"
      />

      <section id="product-list" className="space-y-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
              {dictionary.home.allProductsEyebrow}
            </span>
            <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
              {dictionary.home.allProductsTitle}
            </h2>
            <p className="max-w-2xl text-neutral-600">
              {dictionary.home.allProductsDescription}
            </p>
          </div>
          <ProductSortControl
            sortLabel={dictionary.catalog.sortLabel}
            ascLabel={dictionary.catalog.priceSort.asc}
            descLabel={dictionary.catalog.priceSort.desc}
            initialSort={sortParam}
          />
        </header>
        <ProductGrid products={products} dictionary={dictionary} locale={locale} />
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
              {dictionary.home.featuredTitle}
            </h2>
            <p className="max-w-2xl text-neutral-600">
              {dictionary.home.featuredDescription}
            </p>
          </div>
          <Button asChild variant="ghost" className="self-start md:self-auto">
            <Link href={withLocale(locale, "/licor")}>{dictionary.home.shopNow}</Link>
          </Button>
        </div>
        <FeaturedCarousel products={featured} dictionary={dictionary} locale={locale} />
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 text-center">
          <h2 className="text-3xl font-semibold text-neutral-900">
            {dictionary.home.exploreCollections}
          </h2>
          <p className="mx-auto max-w-2xl text-neutral-600">
            {dictionary.home.featuredDescription}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {(
            Object.entries(dictionary.home.categories) as Array<
              [keyof typeof dictionary.home.categories, string]
            >
          ).map(([key, label]) => {
            const slug = categorySlugMap[key as string] ?? key;
            const href = withLocale(locale, `/${slug}`);
            return (
              <Link
                key={slug}
                href={href}
                className="group relative overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-48 overflow-hidden rounded-2xl bg-neutral-100">
                  <Image
                    src={categoryImages[slug] ?? "/assets/palmanhac-licor-cafe.png"}
                    alt={label}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-semibold text-neutral-900">{label}</h3>
                  <p className="text-sm text-neutral-500">
                    {
                      navConfig[locale].main.find((item) => item.href === `/${slug}`)
                        ?.label
                    }
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
