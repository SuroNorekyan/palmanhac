import { ContactForm } from "@/components/common/ContactForm";
import { extractLocale, siteConfig } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return (
    <section className="grid gap-12 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold text-neutral-900">
          {dictionary.contact.heading}
        </h1>
        <p className="text-neutral-600">{dictionary.contact.subheading}</p>
        <div className="mt-8 space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Palmanhac</h2>
          <div className="space-y-2 text-sm text-neutral-600">
            <p>{siteConfig.contact.address}</p>
            <p>{siteConfig.contact.phone}</p>
            <p>{siteConfig.contact.email}</p>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm">
        <ContactForm dictionary={dictionary} />
      </div>
    </section>
  );
}
