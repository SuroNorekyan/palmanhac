import { CheckoutThankYou } from "@/components/checkout/CheckoutThankYou";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function CheckoutThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ orderId?: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);
  const resolvedSearch = (await searchParams) ?? {};
  const orderId =
    typeof resolvedSearch.orderId === "string" && resolvedSearch.orderId.trim()
      ? resolvedSearch.orderId.trim()
      : undefined;

  return <CheckoutThankYou dictionary={dictionary} locale={locale} orderId={orderId} />;
}
