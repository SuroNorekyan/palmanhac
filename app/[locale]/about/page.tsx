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
      <div className="grid gap-8 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 shadow-sm md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">
            {dictionary.about.addressHeading}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {dictionary.about.logistics}
          </p>
        </div>
        <div className="space-y-2 text-sm text-neutral-700">
          {dictionary.about.addressLines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
          <a
            href="https://www.livroreclamacoes.pt"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[rgb(var(--primary))] hover:underline"
          >
            {dictionary.footer.complaintsBook}
          </a>
        </div>
      </div>
    </section>
  );
}
