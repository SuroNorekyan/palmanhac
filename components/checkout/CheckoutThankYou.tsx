"use client";

import Link from "next/link";
import { formatNoticeWithEmail, WarningNotice } from "@/components/common/WarningNotice";
import { Button } from "@/components/ui/button";
import { siteConfig, type Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { withLocale } from "@/lib/utils/locale";

type CheckoutThankYouProps = {
  dictionary: Dictionary;
  locale: Locale;
  orderId?: string;
};

export function CheckoutThankYou({ dictionary, locale, orderId }: CheckoutThankYouProps) {
  const checkoutCopy = dictionary.checkout;
  const friendlyOrderCode = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : null;
  const ordersHref = withLocale(locale, "/orders");
  const highlightHref = orderId
    ? withLocale(locale, `/orders?orderId=${encodeURIComponent(orderId)}`)
    : ordersHref;
  const supportEmail = siteConfig.contact.email;

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 text-center shadow-sm">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">{checkoutCopy.thankYouSubheading}</p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          {checkoutCopy.thankYouHeading}
        </h1>
        {friendlyOrderCode ? (
          <p className="text-sm text-neutral-600">
            {checkoutCopy.thankYouOrderLabel}:{" "}
            <span className="font-semibold text-neutral-900">{friendlyOrderCode}</span>
          </p>
        ) : null}
      </header>
      <WarningNotice
        variant="orange"
        title={checkoutCopy.confirmationNoticeTitle}
        message={formatNoticeWithEmail(
          checkoutCopy.confirmationNotice,
          supportEmail,
          "font-semibold underline text-orange-900 underline-offset-2",
        )}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline">
          <Link href={ordersHref}>{checkoutCopy.thankYouOrdersCta}</Link>
        </Button>
        <Button asChild>
          <Link href={highlightHref}>{checkoutCopy.thankYouTrackCta}</Link>
        </Button>
      </div>
    </section>
  );
}
