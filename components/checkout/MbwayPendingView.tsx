"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/config/site";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/lib/store/cart";
import { withLocale } from "@/lib/utils/locale";

type MbwayPendingViewProps = {
  dictionary: Dictionary;
  locale: Locale;
  orderId: string;
  transactionId?: string;
};

type StatusState = "pending" | "paid" | "failed";

export function MbwayPendingView({
  dictionary,
  locale,
  orderId,
  transactionId,
}: MbwayPendingViewProps) {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clear);
  const [statusState, setStatusState] = useState<StatusState>("pending");
  const [statusMessage, setStatusMessage] = useState(
    dictionary.checkout.pendingStatusAwaiting,
  );
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!transactionId) return;
    let cancelled = false;

    const poll = async () => {
      setIsChecking(true);
      try {
        const response = await fetch(
          `/api/payments/eupago/status?transactionId=${encodeURIComponent(transactionId)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json().catch(() => ({}))) as {
          status?: { status?: string; error?: string };
        };

        if (cancelled) return;

        if (!response.ok) {
          setStatusState("pending");
          setStatusMessage(dictionary.checkout.pendingStatusAwaiting);
          return;
        }

        const rawStatus = (payload.status?.status ?? "").toLowerCase();
        if (rawStatus.includes("paid") || rawStatus === "ok" || rawStatus === "success") {
          setStatusState("paid");
          setStatusMessage(dictionary.checkout.pendingStatusPaid);
          clearCart();
          setTimeout(() => {
            router.push(withLocale(locale, "/orders"));
          }, 1500);
          return;
        }

        if (rawStatus.includes("fail") || rawStatus.includes("error")) {
          setStatusState("failed");
          setStatusMessage(
            payload.status?.error ?? dictionary.checkout.pendingStatusFailed,
          );
          return;
        }

        setStatusState("pending");
        setStatusMessage(
          payload.status?.error
            ? `${dictionary.checkout.pendingStatusAwaiting} (${payload.status.error})`
            : dictionary.checkout.pendingStatusAwaiting,
        );
      } catch {
        if (!cancelled) {
          setStatusState("pending");
          setStatusMessage(dictionary.checkout.pendingStatusAwaiting);
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
    dictionary.checkout.pendingStatusAwaiting,
    dictionary.checkout.pendingStatusFailed,
    dictionary.checkout.pendingStatusPaid,
    clearCart,
    locale,
    router,
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
