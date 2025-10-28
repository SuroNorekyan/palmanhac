import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { navConfig } from "@/config/nav";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getFeaturedProducts } from "@/lib/server/products";
import { withLocale } from "@/lib/utils/locale";

const categoryImages: Record<string, string> = {
  licor: "/assets/palmanhac-licor-laranja.png",
  aguardente: "/assets/palmanhac-aguardente-morango.png",
  "bebida-espiritosa": "/assets/palmanhac-spirit-cola.png",
};

const categorySlugMap: Record<string, string> = {
  licor: "licor",
  aguardente: "aguardente",
  bebidaEspirituosa: "bebida-espiritosa",
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);
  const featured = await getFeaturedProducts(locale, 6);

  return (
    <div className="space-y-20">
      <section className="grid gap-10 rounded-[2.5rem] bg-white p-10 shadow-[0px_30px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <span className="rounded-full bg-neutral-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
              Palmanhac Shop
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-neutral-900 lg:text-5xl">
              {dictionary.home.heroHeading}
            </h1>
            <p className="max-w-xl text-base text-neutral-600 lg:text-lg">
              {dictionary.home.heroSubheading}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href={withLocale(locale, "/licor")}>{dictionary.home.shopNow}</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link href={withLocale(locale, "/about")}>
                {dictionary.home.exploreCollections}
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-[2rem]">
          <Image
            src="/assets/palmanhac-aguardente-limao-reserva.png"
            alt="Palmanhac hero"
            fill
            className="object-cover"
            priority
          />
        </div>
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

      <section className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-neutral-900">
              {dictionary.home.featuredTitle}
            </h2>
            <p className="mt-2 max-w-xl text-neutral-600">
              {dictionary.home.featuredDescription}
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href={withLocale(locale, "/licor")}>{dictionary.home.shopNow}</Link>
          </Button>
        </div>
        <ProductGrid products={featured} dictionary={dictionary} locale={locale} />
      </section>
    </div>
  );
}
