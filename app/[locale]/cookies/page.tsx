import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold text-neutral-900">
        {dictionary.footer.legalLinks.cookies}
      </h1>
      <p className="text-neutral-500">
        Placeholder content. Cookie policy details will be published shortly.
      </p>
    </section>
  );
}
