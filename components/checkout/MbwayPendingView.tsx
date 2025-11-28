"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatNoticeWithEmail, WarningNotice } from "@/components/common/WarningNotice";
import { Button } from "@/components/ui/button";
import { siteConfig, type Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/lib/store/cart";
import { withLocale } from "@/lib/utils/locale";

type MbwayPendingViewProps = {
  dictionary: Dictionary;
  locale: Locale;
  orderId: string;
  transactionId?: string;
  statusUrl?: string;
};

type StatusState = "pending" | "paid" | "failed";

export function MbwayPendingView({
  dictionary,
  locale,
  orderId,
  transactionId,
  statusUrl,
}: MbwayPendingViewProps) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clear);
  const supportEmail = siteConfig.contact.email;
  const friendlyOrderCode = `#${orderId.slice(0, 8).toUpperCase()}`;
  const [statusState, setStatusState] = useState<StatusState>("pending");
  const [statusMessage, setStatusMessage] = useState(
    dictionary.checkout.pendingStatusAwaiting,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const thankYouHref = withLocale(
    locale,
    orderId ? `/checkout/thank-you?orderId=${encodeURIComponent(orderId)}` : "/orders",
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSupportMessage(true), 60000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!transactionId) return;
    let cancelled = false;

    const poll = async () => {
      setIsChecking(true);
      try {
        const url = new URL("/api/payments/eupago/status", window.location.origin);
        url.searchParams.set("transactionId", transactionId);
        if (orderId) {
          url.searchParams.set("orderId", orderId);
        }
        const response = await fetch(url.toString(), { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as {
          status?: { status?: string; error?: string };
        };

        if (cancelled) return;

        if (!response.ok) {
          setStatusState("pending");
          setStatusMessage(dictionary.checkout.pendingStatusAwaiting);
          setShowSupportMessage(true);
          return;
        }

        const rawStatus = (payload.status?.status ?? "").toLowerCase();
        const isPaidStatus =
          rawStatus === "ok" ||
          rawStatus === "success" ||
          rawStatus.includes("paid") ||
          rawStatus.includes("paga") ||
          rawStatus.includes("sucesso") ||
          rawStatus.includes("captur");
        if (isPaidStatus) {
          setStatusState("paid");
          setStatusMessage(dictionary.checkout.pendingStatusPaid);
          clearCart();
          setTimeout(() => {
            router.push(thankYouHref);
          }, 1500);
          return;
        }

        const isFailureStatus =
          rawStatus.includes("fail") ||
          rawStatus.includes("error") ||
          rawStatus.includes("denied") ||
          rawStatus.includes("recus") ||
          rawStatus.includes("cancel") ||
          rawStatus.includes("expir");
        if (isFailureStatus) {
          setStatusState("failed");
          setStatusMessage(
            payload.status?.error ?? dictionary.checkout.pendingStatusFailed,
          );
          setShowSupportMessage(true);
          return;
        }

        const pendingError = payload.status?.error ?? "";
        const shouldShowError =
          pendingError &&
          !pendingError.toLowerCase().includes("status url unavailable") &&
          !pendingError.toLowerCase().includes("await webhook");
        setStatusState("pending");
        setStatusMessage(
          shouldShowError
            ? `${dictionary.checkout.pendingStatusAwaiting} (${pendingError})`
            : dictionary.checkout.pendingStatusAwaiting,
        );
      } catch {
        if (!cancelled) {
          setStatusState("pending");
          setStatusMessage(dictionary.checkout.pendingStatusAwaiting);
          setShowSupportMessage(true);
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    poll();
    const timer = window.setInterval(poll, 7000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    transactionId,
    orderId,
    dictionary.checkout.pendingStatusAwaiting,
    dictionary.checkout.pendingStatusFailed,
    dictionary.checkout.pendingStatusPaid,
    clearCart,
    router,
    thankYouHref,
  ]);

  return (
    <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-[rgb(var(--border))] bg-white p-8 text-center shadow-sm">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">
          {dictionary.checkout.pendingSubheading}
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.checkout.pendingHeading}
        </h1>
        <p className="text-neutral-600">{dictionary.checkout.pendingDescription}</p>
      </header>
      <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-left text-sm text-neutral-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {dictionary.checkout.pendingStatusLabel}
        </p>
        <p className="text-base font-semibold text-neutral-900">{statusMessage}</p>
        {transactionId ? (
          <p className="mt-2 text-xs text-neutral-500">
            ID: {transactionId.slice(0, 12)}…
            {isChecking && (
              <span className="ml-2 text-neutral-400">
                {dictionary.checkout.statusCheckInProgress}
              </span>
            )}
          </p>
        ) : null}
      </div>
      {statusState !== "paid" ? (
        <p className="text-sm text-neutral-500">{dictionary.checkout.pendingHint}</p>
      ) : null}
      {statusUrl ? (
        <p className="text-sm text-neutral-600">
          <a
            href={statusUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
          >
            {dictionary.checkout.mbwayStatusLink}
          </a>
        </p>
      ) : null}
      {showSupportMessage && statusState !== "paid" ? (
        <p className="text-sm text-neutral-600">
          {dictionary.checkout.pendingSupportMessage.replace(
            "{orderId}",
            friendlyOrderCode,
          )}
        </p>
      ) : null}
      <WarningNotice
        variant="orange"
        title={dictionary.checkout.confirmationNoticeTitle}
        message={formatNoticeWithEmail(
          dictionary.checkout.confirmationNotice,
          supportEmail,
          "font-semibold underline text-orange-900 underline-offset-2",
        )}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.refresh()}
          disabled={isChecking}
        >
          {dictionary.checkout.pendingRefresh}
        </Button>
        <Button asChild>
          <Link href={withLocale(locale, "/orders")}>
            {dictionary.checkout.pendingOrdersCta}
          </Link>
        </Button>
      </div>
    </section>
  );
}
