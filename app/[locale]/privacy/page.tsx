import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold text-neutral-900">
        {dictionary.footer.legalLinks.privacy}
      </h1>
      <p className="text-neutral-500">
        Placeholder content. Detailed policies will be added before launch.
      </p>
    </section>
  );
}
