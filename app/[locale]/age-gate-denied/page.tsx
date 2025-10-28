import Link from "next/link";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AgeGateDeniedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-3xl font-semibold text-neutral-900">
        {dictionary.ageGate.deniedTitle}
      </h1>
      <p className="max-w-xl text-sm text-[rgb(var(--muted-foreground))]">
        {dictionary.ageGate.deniedDescription}
      </p>
      <Link
        href={`/${locale}`}
        className="text-sm font-medium text-[rgb(var(--primary))] hover:underline"
      >
        {dictionary.home.shopNow}
      </Link>
    </section>
  );
}
