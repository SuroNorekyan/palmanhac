import Link from "next/link";
import { auth } from "@/auth";
import { extractLocale } from "@/config/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getOrdersForUser } from "@/lib/server/orders";
import { formatCurrency } from "@/lib/utils/currency";
import { withLocale } from "@/lib/utils/locale";

const localeFormatMap = {
  en: "en-GB",
  pt: "pt-PT",
} as const;

const formatDate = (locale: keyof typeof localeFormatMap, value: Date) =>
  new Intl.DateTimeFormat(localeFormatMap[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await extractLocale(params);
  const dictionary = getDictionary(locale);
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">
          {dictionary.account.heading}
        </h1>
        <p className="text-neutral-600">{dictionary.orders.empty}</p>
        <Link
          href={withLocale(
            locale,
            `/account?callbackUrl=${encodeURIComponent(withLocale(locale, "/orders"))}`,
          )}
          className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
        >
          {dictionary.account.login}
        </Link>
      </div>
    );
  }

  const orders = await getOrdersForUser(session.user.id);

  if (!orders.length) {
    return (
      <section className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.orders.heading}
        </h1>
        <p className="text-neutral-600">{dictionary.orders.empty}</p>
        <Link
          href={withLocale(locale, "/")}
          className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
        >
          {dictionary.home.shopNow}
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.orders.heading}
        </h1>
        <p className="text-sm text-neutral-600">
          {dictionary.account.dashboard.manageAccount}
        </p>
      </header>
      <div className="space-y-6">
        {orders.map((order) => {
          const itemCount = dictionary.orders.itemCount.replace(
            "{count}",
            order.items.length.toString(),
          );
          let paymentHint: string | null = null;
          if (order.paymentStatus === "PAID") {
            paymentHint = dictionary.orders.statusDetails.paid;
          } else if (order.paymentMethod === "MBWAY") {
            paymentHint = dictionary.orders.statusDetails.mbwayPending;
          } else if (order.paymentMethod === "MULTIBANCO") {
            paymentHint = dictionary.orders.statusDetails.multibancoPending;
          } else if (order.paymentMethod === "CARD") {
            paymentHint = dictionary.orders.statusDetails.cardPending;
          }
          const paymentMethodKey =
            order.paymentMethod === "MBWAY"
              ? "mbway"
              : order.paymentMethod === "CARD"
                ? "card"
                : order.paymentMethod === "MULTIBANCO"
                  ? "multibanco"
                  : null;
          const paymentMethodLabel = paymentMethodKey
            ? dictionary.checkout.methods[paymentMethodKey]
            : (order.paymentProvider ?? dictionary.orders.paymentMethodUnknown);
          return (
            <article
              key={order.id}
              className="space-y-4 rounded-3xl border border-[rgb(var(--border))] bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap justify-between gap-3 text-sm text-neutral-600">
                <div>
                  <span className="font-semibold text-neutral-900">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="ml-3">
                    {dictionary.orders.placedOn}: {formatDate(locale, order.createdAt)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span>{dictionary.orders.status[order.status] ?? order.status}</span>
                  <span>
                    {dictionary.orders.paymentStatus[order.paymentStatus] ??
                      order.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-dashed border-[rgb(var(--border))] pb-3">
                <span className="text-sm text-neutral-500">{itemCount}</span>
                <span className="text-lg font-semibold text-neutral-900">
                  {dictionary.orders.total}: {formatCurrency(locale, order.totalAmount)}
                </span>
              </div>
              <div className="text-sm text-neutral-600">
                {dictionary.orders.paymentMethodLabel}:{" "}
                <span className="font-semibold text-neutral-900">
                  {paymentMethodLabel}
                </span>
              </div>
              <ul className="space-y-3">
                {order.items.length === 0 ? (
                  <li className="text-sm text-neutral-500">
                    {dictionary.orders.noItems}
                  </li>
                ) : (
                  order.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap justify-between gap-3">
                      <div className="space-y-1">
                        <Link
                          href={withLocale(locale, `/product/${item.product.slug}`)}
                          className="font-medium text-neutral-900 underline-offset-4 hover:underline"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-neutral-500">
                          {item.quantity} × {formatCurrency(locale, item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-neutral-700">
                        {formatCurrency(locale, item.unitPrice * item.quantity)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
              {paymentHint ? (
                <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
                  {paymentHint}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
