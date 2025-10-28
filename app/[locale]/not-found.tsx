import Link from "next/link";
import { Button } from "@/components/ui/button";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { withLocale } from "@/lib/utils/locale";

export default async function NotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return (
    <section className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-semibold text-neutral-900">404</h1>
      <p className="max-w-md text-neutral-500">Palmanhac could not find this page.</p>
      <Button asChild>
        <Link href={withLocale(locale, "/")}>{dictionary.home.shopNow}</Link>
      </Button>
    </section>
  );
}
