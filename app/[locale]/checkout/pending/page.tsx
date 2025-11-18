import { MbwayPendingView } from "@/components/checkout/MbwayPendingView";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function MbwayPendingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ orderId?: string; transactionId?: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);
  const resolvedSearch = (await searchParams) ?? {};

  if (!resolvedSearch.orderId) {
    return (
      <section className="mx-auto max-w-xl space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {dictionary.checkout.pendingMissingOrder}
        </h1>
      </section>
    );
  }

  return (
    <MbwayPendingView
      dictionary={dictionary}
      locale={locale}
      orderId={resolvedSearch.orderId}
      transactionId={resolvedSearch.transactionId}
    />
  );
}
