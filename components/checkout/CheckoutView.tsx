"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/config/site";
import { useAnonCartImport } from "@/lib/hooks/useAnonCartImport";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCartStore } from "@/lib/store/cart";
import { calculateCartTotals } from "@/lib/utils/cart-totals";
import { formatCurrency } from "@/lib/utils/currency";
import { withLocale } from "@/lib/utils/locale";

const localeFormatMap = {
  en: "en-GB",
  pt: "pt-PT",
} as const;

const formatDateTime = (locale: Locale, value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat(localeFormatMap[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const DEFAULT_COUNTRY = "Portugal";

type PaymentMethodOption = "multibanco" | "mbway" | "card";

type EuPagoBaseResponse = {
  orderId: string;
  method: PaymentMethodOption;
  totalCents: number;
  currency: string;
};

type EuPagoMultibancoResponse = EuPagoBaseResponse & {
  method: "multibanco";
  entity: string;
  reference: string;
  providerAmount?: number;
  expiresAt?: string;
};

type EuPagoMBWayResponse = EuPagoBaseResponse & {
  method: "mbway";
  transactionId: string;
  statusUrl?: string;
};

type EuPagoCardResponse = EuPagoBaseResponse & {
  method: "card";
  paymentUrl: string;
  transactionId: string;
};

type EuPagoCreateResponse =
  | EuPagoMultibancoResponse
  | EuPagoMBWayResponse
  | EuPagoCardResponse;

type EuPagoStatusResponse = {
  status: {
    status: string;
    paidAt?: string;
    error?: string;
  };
};

type CheckoutProduct = {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
};

type AddressState = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
};

const paymentOptions: PaymentMethodOption[] = ["multibanco", "mbway", "card"];

export function CheckoutView({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  useAnonCartImport({ status, userId: session?.user?.id });

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);

  const [products, setProducts] = useState<CheckoutProduct[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>("multibanco");
  const [contact, setContact] = useState({
    email: session?.user?.email ?? "",
    phone: "",
    name: session?.user?.name ?? "",
  });
  const [shipping, setShipping] = useState<AddressState>({
    name: session?.user?.name ?? "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: DEFAULT_COUNTRY,
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billing, setBilling] = useState<AddressState>({
    name: session?.user?.name ?? "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: DEFAULT_COUNTRY,
  });
  const [notes, setNotes] = useState("");
  const [mbwayPhone, setMbwayPhone] = useState("");
  const [paymentResult, setPaymentResult] = useState<EuPagoCreateResponse | null>(null);
  const [mbwayStatus, setMbwayStatus] = useState<string | null>(null);
  const [pollingState, setPollingState] = useState<
    "idle" | "polling" | "complete" | "failed"
  >("idle");
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef(0);
  const hasClearedCartRef = useRef(false);

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      setContact((prev) =>
        prev.email ? prev : { ...prev, email: session.user?.email ?? "" },
      );
    }
    if (session?.user?.name) {
      setContact((prev) =>
        prev.name ? prev : { ...prev, name: session.user?.name ?? "" },
      );
      setShipping((prev) =>
        prev.name ? prev : { ...prev, name: session.user?.name ?? "" },
      );
      setBilling((prev) =>
        prev.name ? prev : { ...prev, name: session.user?.name ?? "" },
      );
    }
  }, [session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (billingSameAsShipping) {
      setBilling({ ...shipping });
    }
  }, [billingSameAsShipping, shipping]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        withLocale(
          locale,
          `/account?callbackUrl=${encodeURIComponent(withLocale(locale, "/checkout"))}`,
        ),
      );
    }
  }, [status, locale, router]);

  useEffect(() => {
    if (!items.length) {
      setProducts([]);
      return;
    }

    const ids = items.map((item) => item.productId);
    if (!ids.length) return;

    setIsFetchingProducts(true);
    const controller = new AbortController();
    fetch(`/api/products?ids=${ids.join(",")}&locale=${locale}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        const data = (await res.json()) as { products: CheckoutProduct[] };
        setProducts(data.products);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      })
      .finally(() => setIsFetchingProducts(false));

    return () => controller.abort();
  }, [items, locale]);

  useEffect(() => {
    if (paymentResult?.method !== "mbway") {
      setMbwayStatus(null);
    }
  }, [paymentResult?.method]);

  useEffect(() => {
    if (!mbwayPhone && contact.phone) {
      setMbwayPhone(contact.phone);
    }
  }, [contact.phone, mbwayPhone]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const totals = useMemo(() => calculateCartTotals(items, products), [items, products]);

  const normalisedItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    [items],
  );

  const normalisedContact = useMemo(
    () => ({
      email: contact.email.trim(),
      phone: contact.phone.trim() || undefined,
      name: contact.name.trim() || undefined,
    }),
    [contact.email, contact.phone, contact.name],
  );

  const normalisedShipping = useMemo(
    () => ({
      name: shipping.name.trim(),
      line1: shipping.line1.trim(),
      line2: shipping.line2.trim() || undefined,
      city: shipping.city.trim(),
      postalCode: shipping.postalCode.trim(),
      country: shipping.country.trim(),
    }),
    [
      shipping.name,
      shipping.line1,
      shipping.line2,
      shipping.city,
      shipping.postalCode,
      shipping.country,
    ],
  );

  const normalisedBilling = useMemo(() => {
    const source = billingSameAsShipping ? shipping : billing;
    return {
      name: source.name.trim(),
      line1: source.line1.trim(),
      line2: source.line2.trim() || undefined,
      city: source.city.trim(),
      postalCode: source.postalCode.trim(),
      country: source.country.trim(),
    };
  }, [billingSameAsShipping, billing, shipping]);

  const buildCheckoutPayload = () => {
    const base = {
      method: selectedMethod,
      items: normalisedItems,
      contact: normalisedContact,
      shipping: normalisedShipping,
      billing: normalisedBilling,
      notes: notes.trim() || undefined,
      currency: "EUR" as const,
      locale,
      totals: {
        itemsSubtotalCents: totals.itemsSubtotalCents,
        deliveryCents: totals.deliveryCents,
        discountCents: totals.discountCents,
        totalCents: totals.totalCents,
      },
    };

    if (selectedMethod === "mbway") {
      const normalizedPhone = mbwayPhone.trim() || contact.phone.trim() || undefined;
      return {
        ...base,
        mbwayPhone: normalizedPhone,
      };
    }

    return base;
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const clearCartOnce = () => {
    if (!hasClearedCartRef.current) {
      clearCart();
      hasClearedCartRef.current = true;
    }
  };

  const startMbWayPolling = (transactionId: string) => {
    stopPolling();
    pollingAttemptsRef.current = 0;
    setPollingState("polling");
    setMbwayStatus(dictionary.checkout.mbwayAwaiting);

    const poll = async () => {
      pollingAttemptsRef.current += 1;
      try {
        const response = await fetch(
          `/api/payments/eupago/status?transactionId=${encodeURIComponent(transactionId)}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as EuPagoStatusResponse & {
          error?: string;
          requiresConfiguration?: boolean;
        };

        if (!response.ok) {
          stopPolling();
          setPollingState("failed");
          setServerError(result.error ?? dictionary.checkout.paymentServiceUnavailable);
          return;
        }

        const rawStatus = result.status.status.toLowerCase();
        if (rawStatus.includes("paid") || rawStatus === "ok" || rawStatus === "success") {
          stopPolling();
          setPollingState("complete");
          clearCartOnce();
          router.push(withLocale(locale, "/orders"));
          return;
        }

        if (rawStatus.includes("fail") || rawStatus.includes("error")) {
          stopPolling();
          setPollingState("failed");
          setServerError(dictionary.checkout.statusFailed);
          return;
        }

        setMbwayStatus(rawStatus);
      } catch (error) {
        console.error("[EuPago] MB WAY status error", error);
        stopPolling();
        setPollingState("failed");
        setServerError(dictionary.checkout.paymentServiceUnavailable);
      }

      if (pollingAttemptsRef.current >= 24) {
        stopPolling();
        setPollingState("idle");
        setMbwayStatus(dictionary.checkout.statusPollingTimedOut);
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 5000);
  };

  const resetPaymentState = () => {
    stopPolling();
    setPaymentResult(null);
    setMbwayStatus(null);
    setPollingState("idle");
    hasClearedCartRef.current = false;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    if (!items.length) {
      setServerError(dictionary.checkout.summaryEmpty);
      return;
    }

    if (selectedMethod === "mbway") {
      const phoneNumber = mbwayPhone.trim() || contact.phone.trim();
      if (!phoneNumber) {
        setServerError(dictionary.checkout.mbwayPhoneRequired);
        return;
      }
    }

    setIsSubmitting(true);
    resetPaymentState();

    try {
      const payload = buildCheckoutPayload();

      if (process.env.NODE_ENV !== "production") {
        console.debug("[Checkout] Submitting payload", payload);
      }

      const response = await fetch("/api/payments/eupago/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as EuPagoCreateResponse & {
        error?: string;
        requiresConfiguration?: boolean;
      };

      if (!response.ok) {
        const diagnostic = {
          status: response.status,
          payload,
          result,
          responseText: await response.text().catch(() => undefined),
        };
        console.error("[Checkout] Create payment failed", diagnostic);
        setServerError(result.error ?? dictionary.checkout.paymentServiceUnavailable);
        return;
      }

      setPaymentResult(result);

      if (result.method === "multibanco") {
        setTimeout(() => clearCartOnce(), 300);
      }

      if (result.method === "mbway") {
        if (result.transactionId) {
          startMbWayPolling(result.transactionId);
        }
        return;
      }

      if (result.method === "card") {
        clearCartOnce();
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = result.paymentUrl;
          }, 400);
        }
      }
    } catch (error) {
      console.error("[EuPago] Checkout error", error);
      setServerError(dictionary.checkout.paymentServiceUnavailable);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethodCards = paymentOptions.map((option) => {
    const isActive = selectedMethod === option;
    const titles = dictionary.checkout.methods;
    const descriptions = dictionary.checkout.methodDescriptions;
    return (
      <label
        key={option}
        className={`flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition ${
          isActive
            ? "border-neutral-900 bg-neutral-50"
            : "border-neutral-200 bg-white hover:border-neutral-400"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            className="mt-1 h-4 w-4"
            type="radio"
            name="payment-method"
            value={option}
            checked={isActive}
            onChange={() => {
              setSelectedMethod(option);
              resetPaymentState();
            }}
          />
          <div>
            <p className="font-semibold text-neutral-900">{titles[option]}</p>
            <p className="text-sm text-neutral-600">{descriptions[option]}</p>
          </div>
        </div>
      </label>
    );
  });

  const renderPaymentResult = () => {
    if (!paymentResult) {
      return null;
    }

    if (paymentResult.method === "multibanco") {
      const amountEuros =
        typeof paymentResult.providerAmount === "number"
          ? paymentResult.providerAmount
          : paymentResult.totalCents / 100;
      const amountCents = Math.round(amountEuros * 100);
      const expiresLabel = formatDateTime(locale, paymentResult.expiresAt);
      return (
        <Card className="border border-neutral-200 bg-neutral-50">
          <CardHeader>
            <CardTitle>{dictionary.checkout.resultHeading}</CardTitle>
            <CardDescription>
              {dictionary.checkout.resultInstructions.multibanco}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm text-neutral-700">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-neutral-500">
                  {dictionary.checkout.resultFields.entity}
                </p>
                <p className="font-semibold text-neutral-900">{paymentResult.entity}</p>
              </div>
              <div>
                <p className="text-neutral-500">
                  {dictionary.checkout.resultFields.reference}
                </p>
                <p className="font-semibold text-neutral-900">
                  {paymentResult.reference}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">
                  {dictionary.checkout.resultFields.amount}
                </p>
                <p className="font-semibold text-neutral-900">
                  {formatCurrency(locale, amountCents)}
                </p>
              </div>
              {expiresLabel ? (
                <div>
                  <p className="text-neutral-500">
                    {dictionary.checkout.resultFields.expiresAt}
                  </p>
                  <p className="font-semibold text-neutral-900">{expiresLabel}</p>
                </div>
              ) : null}
            </div>
            <p className="rounded-lg bg-white p-3 text-xs text-neutral-600">
              {dictionary.checkout.multibancoReminder}
            </p>
            <Link
              href={withLocale(locale, "/orders")}
              className="text-xs font-semibold text-neutral-900 underline-offset-4 hover:underline"
            >
              {dictionary.checkout.viewOrdersCta}
            </Link>
          </CardContent>
        </Card>
      );
    }

    if (paymentResult.method === "mbway") {
      return (
        <Card className="border border-neutral-200 bg-neutral-50">
          <CardHeader>
            <CardTitle>{dictionary.checkout.resultHeading}</CardTitle>
            <CardDescription>
              {dictionary.checkout.resultInstructions.mbway}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-700">
            <p className="rounded-lg bg-white p-3 text-neutral-600">
              {dictionary.checkout.mbwayPrompt}
            </p>
            {mbwayStatus ? (
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                {`${dictionary.checkout.statusLabel}: ${mbwayStatus}`}
              </p>
            ) : null}
            {pollingState === "polling" ? (
              <p className="text-xs text-neutral-500">
                {dictionary.checkout.statusCheckInProgress}
              </p>
            ) : null}
            {pollingState === "failed" ? (
              <p className="text-xs text-red-600">{dictionary.checkout.statusFailed}</p>
            ) : null}
            {pollingState === "complete" ? (
              <p className="text-xs text-neutral-600">{dictionary.checkout.statusPaid}</p>
            ) : null}
            {paymentResult.statusUrl ? (
              <a
                href={paymentResult.statusUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-neutral-900 underline-offset-4 hover:underline"
              >
                {dictionary.checkout.mbwayStatusLink}
              </a>
            ) : null}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border border-neutral-200 bg-neutral-50">
        <CardHeader>
          <CardTitle>{dictionary.checkout.resultHeading}</CardTitle>
          <CardDescription>{dictionary.checkout.resultInstructions.card}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-700">
          <p className="rounded-lg bg-white p-3 text-neutral-600">
            {dictionary.checkout.cardRedirectMessage}
          </p>
        </CardContent>
      </Card>
    );
  };

  const buttonLabel = isSubmitting
    ? dictionary.checkout.processingPayment
    : dictionary.checkout.startPaymentCta;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="text-sm text-neutral-500">{dictionary.checkout.subheading}</p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          {dictionary.checkout.heading}
        </h1>
      </header>
      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{dictionary.checkout.summary}</CardTitle>
            <CardDescription>{dictionary.checkout.summaryEmpty}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={() => router.push(withLocale(locale, "/cart"))}
            >
              {dictionary.cart.continueShopping}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form className="grid gap-10 lg:grid-cols-[2fr_1fr]" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{dictionary.checkout.contactInformation}</CardTitle>
                <CardDescription>
                  {dictionary.checkout.paymentMethodDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="checkout-email">
                    {dictionary.checkout.contactEmailLabel}
                  </Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    required
                    value={contact.email}
                    onChange={(event) =>
                      setContact((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="checkout-phone">
                    {dictionary.checkout.contactPhoneLabel}
                  </Label>
                  <Input
                    id="checkout-phone"
                    type="tel"
                    value={contact.phone}
                    onChange={(event) =>
                      setContact((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{dictionary.checkout.shippingAddress}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="shipping-name">
                    {dictionary.checkout.shippingNameLabel}
                  </Label>
                  <Input
                    id="shipping-name"
                    required
                    value={shipping.name}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shipping-line1">
                    {dictionary.checkout.shippingAddress1Label}
                  </Label>
                  <Input
                    id="shipping-line1"
                    required
                    value={shipping.line1}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, line1: event.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shipping-line2">
                    {dictionary.checkout.shippingAddress2Label}
                  </Label>
                  <Input
                    id="shipping-line2"
                    value={shipping.line2}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, line2: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-city">
                    {dictionary.checkout.shippingCityLabel}
                  </Label>
                  <Input
                    id="shipping-city"
                    required
                    value={shipping.city}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, city: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="shipping-postal">
                    {dictionary.checkout.shippingPostalCodeLabel}
                  </Label>
                  <Input
                    id="shipping-postal"
                    required
                    value={shipping.postalCode}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, postalCode: event.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="shipping-country">
                    {dictionary.checkout.shippingCountryLabel}
                  </Label>
                  <Input
                    id="shipping-country"
                    required
                    value={shipping.country}
                    onChange={(event) =>
                      setShipping((prev) => ({ ...prev, country: event.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{dictionary.checkout.billingAddress}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(event) => setBillingSameAsShipping(event.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  {dictionary.checkout.billingSameAsShipping}
                </label>
                {!billingSameAsShipping ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label htmlFor="billing-name">
                        {dictionary.checkout.shippingNameLabel}
                      </Label>
                      <Input
                        id="billing-name"
                        required
                        value={billing.name}
                        onChange={(event) =>
                          setBilling((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="billing-line1">
                        {dictionary.checkout.shippingAddress1Label}
                      </Label>
                      <Input
                        id="billing-line1"
                        required
                        value={billing.line1}
                        onChange={(event) =>
                          setBilling((prev) => ({ ...prev, line1: event.target.value }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="billing-line2">
                        {dictionary.checkout.shippingAddress2Label}
                      </Label>
                      <Input
                        id="billing-line2"
                        value={billing.line2}
                        onChange={(event) =>
                          setBilling((prev) => ({ ...prev, line2: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing-city">
                        {dictionary.checkout.shippingCityLabel}
                      </Label>
                      <Input
                        id="billing-city"
                        required
                        value={billing.city}
                        onChange={(event) =>
                          setBilling((prev) => ({ ...prev, city: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing-postal">
                        {dictionary.checkout.shippingPostalCodeLabel}
                      </Label>
                      <Input
                        id="billing-postal"
                        required
                        value={billing.postalCode}
                        onChange={(event) =>
                          setBilling((prev) => ({
                            ...prev,
                            postalCode: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="billing-country">
                        {dictionary.checkout.shippingCountryLabel}
                      </Label>
                      <Input
                        id="billing-country"
                        required
                        value={billing.country}
                        onChange={(event) =>
                          setBilling((prev) => ({ ...prev, country: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{dictionary.checkout.paymentDetails}</CardTitle>
                <CardDescription>
                  {dictionary.checkout.paymentMethodDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{dictionary.checkout.paymentMethodLabel}</Label>
                  <div className="space-y-2">{paymentMethodCards}</div>
                </div>
                {selectedMethod === "mbway" ? (
                  <div className="space-y-2">
                    <Label htmlFor="mbway-phone">
                      {dictionary.checkout.mbwayPhoneLabel}
                    </Label>
                    <Input
                      id="mbway-phone"
                      type="tel"
                      placeholder={dictionary.checkout.mbwayPhonePlaceholder}
                      value={mbwayPhone}
                      onChange={(event) => setMbwayPhone(event.target.value)}
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="checkout-notes">{dictionary.checkout.notesLabel}</Label>
                  <Textarea
                    id="checkout-notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={dictionary.checkout.notesPlaceholder}
                  />
                </div>
                {serverError ? (
                  <p className="text-sm text-red-600">{serverError}</p>
                ) : null}
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {buttonLabel}
                </Button>
              </CardContent>
            </Card>

            {renderPaymentResult()}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{dictionary.checkout.summary}</CardTitle>
                <CardDescription>
                  {dictionary.checkout.summaryItems.replace(
                    "{count}",
                    items.length.toString(),
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-neutral-700">
                {isFetchingProducts ? (
                  <p className="text-neutral-500">Loading…</p>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const product = products.find((p) => p.id === item.productId);
                      if (!product) {
                        return null;
                      }
                      return (
                        <li key={item.productId} className="flex justify-between gap-3">
                          <span>
                            {product.name} × {item.quantity}
                          </span>
                          <span className="font-medium text-neutral-900">
                            {formatCurrency(locale, product.priceCents * item.quantity)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="border-t border-dashed border-neutral-200 pt-3 text-sm">
                  <div className="flex justify-between">
                    <span>{dictionary.checkout.subtotalLabel}</span>
                    <span>{formatCurrency(locale, totals.itemsSubtotalCents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{dictionary.checkout.discountLabel}</span>
                    <span>
                      {totals.discountCents
                        ? `- ${formatCurrency(locale, totals.discountCents)}`
                        : formatCurrency(locale, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{dictionary.checkout.deliveryLabel}</span>
                    <span>{formatCurrency(locale, totals.deliveryCents)}</span>
                  </div>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
                  <span>{dictionary.checkout.total}</span>
                  <span>{formatCurrency(locale, totals.totalCents)}</span>
                </div>
                <p className="text-xs text-neutral-500">
                  {dictionary.checkout.vatIncluded}
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
