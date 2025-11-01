"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
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

const DEFAULT_COUNTRY = "Portugal";

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

  const [contact, setContact] = useState({
    email: session?.user?.email ?? "",
    phone: "",
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
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmPaymentRef = useRef<(() => Promise<boolean>) | null>(null);

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

  useEffect(() => {
    if (session?.user?.email) {
      setContact((prev) =>
        prev.email ? prev : { ...prev, email: session.user?.email ?? "" },
      );
    }
    if (session?.user?.name) {
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

  const totals = useMemo(() => calculateCartTotals(items, products), [items, products]);

  useEffect(() => {
    if (!clientSecret) {
      confirmPaymentRef.current = null;
    }
  }, [clientSecret]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    if (!items.length) {
      setServerError(dictionary.checkout.summaryEmpty);
      return;
    }

    if (!publishableKey) {
      setServerError(dictionary.checkout.stripeNotConfigured);
      return;
    }

    if (!clientSecret) {
      setIsSubmitting(true);
      try {
        const payload = {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          contact: {
            email: contact.email.trim(),
            phone: contact.phone.trim() || undefined,
          },
          shipping: {
            name: shipping.name.trim(),
            line1: shipping.line1.trim(),
            line2: shipping.line2.trim() || undefined,
            city: shipping.city.trim(),
            postalCode: shipping.postalCode.trim(),
            country: shipping.country.trim(),
          },
          billing: {
            name: (billingSameAsShipping ? shipping.name : billing.name).trim(),
            line1: (billingSameAsShipping ? shipping.line1 : billing.line1).trim(),
            line2:
              (billingSameAsShipping ? shipping.line2 : billing.line2).trim() ||
              undefined,
            city: (billingSameAsShipping ? shipping.city : billing.city).trim(),
            postalCode: (billingSameAsShipping
              ? shipping.postalCode
              : billing.postalCode
            ).trim(),
            country: (billingSameAsShipping ? shipping.country : billing.country).trim(),
          },
          notes: notes.trim() || undefined,
          currency: "EUR",
          locale,
        };

        const response = await fetch("/api/checkout/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = (await response.json().catch(() => ({}))) as {
          clientSecret?: string;
          error?: string;
          requiresConfiguration?: boolean;
        };

        if (!response.ok || result.requiresConfiguration) {
          setServerError(result.error ?? dictionary.checkout.stripeNotConfigured);
          return;
        }

        if (!result.clientSecret) {
          setServerError("Unable to initialize payment intent.");
          return;
        }

        setClientSecret(result.clientSecret);
      } catch (error) {
        setServerError(
          error instanceof Error ? error.message : "Unable to start checkout.",
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!confirmPaymentRef.current) {
      setServerError("Payment form is not ready yet.");
      return;
    }

    setIsSubmitting(true);
    try {
      const completed = await confirmPaymentRef.current();
      if (completed) {
        clearCart();
        router.push(withLocale(locale, "/orders"));
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Payment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonLabel = !clientSecret
    ? dictionary.checkout.initiatePaymentCta
    : dictionary.checkout.stripeSubmitCta;

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
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    id="billing-same-shipping"
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                    checked={billingSameAsShipping}
                    onChange={(event) => setBillingSameAsShipping(event.target.checked)}
                  />
                  <Label htmlFor="billing-same-shipping" className="cursor-pointer">
                    {dictionary.checkout.billingSameAsShipping}
                  </Label>
                </div>
                {!billingSameAsShipping && (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{dictionary.checkout.notesLabel}</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="checkout-notes" className="sr-only">
                  {dictionary.checkout.notesLabel}
                </Label>
                <Textarea
                  id="checkout-notes"
                  placeholder={dictionary.checkout.notesPlaceholder}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="resize-none"
                />
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
                <PaymentSection
                  clientSecret={clientSecret}
                  publishableKey={publishableKey || null}
                  locale={locale}
                  dictionary={dictionary}
                  isSubmitting={isSubmitting}
                  onReady={(handler) => {
                    confirmPaymentRef.current = handler;
                  }}
                />
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || status !== "authenticated"}
                >
                  {isSubmitting ? dictionary.checkout.stripeProcessing : buttonLabel}
                </Button>
                {serverError ? (
                  <p className="text-sm text-rose-600">{serverError}</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{dictionary.checkout.summary}</CardTitle>
                <CardDescription>
                  {isFetchingProducts
                    ? "Loading cart items..."
                    : `${dictionary.checkout.summaryItems}: ${items.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      )}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {products.map((product) => {
                    const quantity =
                      items.find((item) => item.productId === product.id)?.quantity ?? 0;
                    return (
                      <div key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-neutral-900">{product.name}</p>
                          <p className="text-sm text-neutral-500">
                            ×{quantity} · {formatCurrency(locale, product.priceCents)}
                          </p>
                        </div>
                        <p className="font-semibold text-neutral-900">
                          {formatCurrency(locale, product.priceCents * quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-2 text-sm font-medium">
                  <div className="flex items-center justify-between">
                    <span>{dictionary.cart.subtotal}</span>
                    <span>{formatCurrency(locale, totals.itemsSubtotalCents)}</span>
                  </div>
                  {totals.discountCents > 0 ? (
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>{dictionary.cart.discount}</span>
                      <span>-{formatCurrency(locale, totals.discountCents)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span>{dictionary.cart.delivery}</span>
                    <span>{formatCurrency(locale, totals.deliveryCents)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>{dictionary.cart.total}</span>
                    <span>{formatCurrency(locale, totals.totalCents)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </form>
      )}
    </div>
  );
}

type PaymentSectionProps = {
  clientSecret: string | null;
  publishableKey: string | null;
  locale: Locale;
  dictionary: Dictionary;
  onReady: (handler: (() => Promise<boolean>) | null) => void;
  isSubmitting: boolean;
};

function PaymentSection({
  clientSecret,
  publishableKey,
  locale,
  dictionary,
  onReady,
  isSubmitting,
}: PaymentSectionProps) {
  const stripePromiseRef = useRef<Promise<Stripe | null> | null>(null);

  if (!stripePromiseRef.current && publishableKey) {
    stripePromiseRef.current = loadStripe(publishableKey);
  }

  useEffect(() => {
    if (!clientSecret) {
      onReady(null);
    }
  }, [clientSecret, onReady]);

  if (!publishableKey) {
    return (
      <p className="text-sm text-neutral-500">
        {dictionary.checkout.stripeNotConfigured}
      </p>
    );
  }

  if (!clientSecret) {
    return (
      <p className="text-sm text-neutral-500">{dictionary.checkout.initiatePaymentCta}</p>
    );
  }

  if (!stripePromiseRef.current) {
    return (
      <p className="text-sm text-neutral-500">{dictionary.checkout.stripeProcessing}</p>
    );
  }

  return (
    <Elements
      key={clientSecret}
      stripe={stripePromiseRef.current}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
        locale,
      }}
    >
      <StripePaymentElement
        locale={locale}
        dictionary={dictionary}
        onReady={onReady}
        isSubmitting={isSubmitting}
      />
    </Elements>
  );
}

type StripePaymentElementProps = {
  locale: Locale;
  dictionary: Dictionary;
  onReady: (handler: (() => Promise<boolean>) | null) => void;
  isSubmitting: boolean;
};

function StripePaymentElement({
  locale,
  dictionary,
  onReady,
  isSubmitting,
}: StripePaymentElementProps) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!stripe || !elements) {
      onReady(null);
      return;
    }

    const handler = async () => {
      if (!stripe || !elements) {
        throw new Error("Stripe is not ready yet.");
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${withLocale(locale, "/orders")}`,
        },
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message ?? "Payment confirmation failed.");
      }

      return paymentIntent?.status === "succeeded";
    };

    onReady(handler);
    return () => {
      onReady(null);
    };
  }, [stripe, elements, locale, onReady]);

  return (
    <div className="space-y-3">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {isSubmitting ? (
        <p className="text-sm text-neutral-500">{dictionary.checkout.stripeProcessing}</p>
      ) : null}
    </div>
  );
}
