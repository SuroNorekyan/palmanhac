import { FavoritesView } from "@/components/favorites/FavoritesView";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return <FavoritesView dictionary={dictionary} locale={locale} />;
}
