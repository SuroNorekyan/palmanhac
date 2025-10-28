import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return (
    <section className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold text-neutral-900">
          {dictionary.about.heading}
        </h1>
        <p className="max-w-2xl text-neutral-600">{dictionary.home.heroSubheading}</p>
      </div>
      <div className="grid gap-10 md:grid-cols-3">
        <article className="space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            {dictionary.about.missionTitle}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {dictionary.about.missionDescription}
          </p>
        </article>
        <article className="space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            {dictionary.about.craftsmanshipTitle}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {dictionary.about.craftsmanshipDescription}
          </p>
        </article>
        <article className="space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            {dictionary.about.heritageTitle}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {dictionary.about.heritageDescription}
          </p>
        </article>
      </div>
    </section>
  );
}
