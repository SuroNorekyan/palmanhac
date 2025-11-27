import { CheckoutView } from "@/components/checkout/CheckoutView";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);

  return <CheckoutView dictionary={dictionary} locale={locale} />;
}
