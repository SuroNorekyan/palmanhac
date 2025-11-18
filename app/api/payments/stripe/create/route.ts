import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { auth } from "@/auth";
import {
  EmailConfigurationError,
  formatEmailBlock,
  sendAdminEmail,
  sendEmail,
} from "@/lib/email/mailer";
import {
  checkoutPayloadSchema,
  normalizeCurrency,
  type CheckoutPayload,
} from "@/lib/payments/checkout-schema";
import { getStripeClient } from "@/lib/payments/stripe";
import { prisma } from "@/lib/server/db";
import { calculateCartTotals } from "@/lib/utils/cart-totals";
import { appendOrderEvent } from "@/lib/utils/order-events";
import { logPaymentEvent } from "@/lib/utils/payment-logger";
import { redactForLogging } from "@/lib/utils/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const logStripeCheckoutEvent = (
  level: Parameters<typeof logPaymentEvent>[0],
  event: string,
  details: Record<string, unknown> = {},
) => logPaymentEvent(level, event, redactForLogging(details) as Record<string, unknown>);

const assertCardMethod = (payload: CheckoutPayload) => {
  if (payload.method !== "card") {
    throw new Error("Stripe checkout only supports card payments.");
  }
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutPayloadSchema.safeParse(body);
  if (!parsed.success) {
    await logStripeCheckoutEvent("warn", "stripe_checkout_invalid_payload", {
      userId: session.user.id,
      issues: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  try {
    assertCardMethod(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unsupported payment method." },
      { status: 400 },
    );
  }

  const productIds = payload.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, priceCents: true, name: true },
  });

  const expectedCount = new Set(productIds).size;
  if (products.length !== expectedCount) {
    return NextResponse.json(
      { error: "One or more products are not available." },
      { status: 404 },
    );
  }

  const totals = calculateCartTotals(
    payload.items,
    products.map((product) => ({
      id: product.id,
      priceCents: product.priceCents,
    })),
  );

  const currency = normalizeCurrency(payload.currency);
  const orderId = randomUUID();
  const description = `Order ${orderId}`;
  const stripe = getStripeClient();

  await logStripeCheckoutEvent("info", "stripe_checkout_payment_intent_creating", {
    userId: session.user.id,
    orderId,
    totalCents: totals.totalCents,
    currency,
  });

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: totals.totalCents,
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      description,
      receipt_email: payload.contact.email,
      metadata: {
        orderId,
        userId: session.user.id,
        locale: payload.locale ?? "",
      },
      shipping: {
        name: payload.shipping.name,
        address: {
          country: payload.shipping.country,
          city: payload.shipping.city,
          postal_code: payload.shipping.postalCode,
          line1: payload.shipping.line1,
          line2: payload.shipping.line2 ?? undefined,
        },
        phone: payload.contact.phone ?? undefined,
      },
    });
  } catch (error) {
    console.error("[Stripe] Failed to create payment intent", error);
    await logStripeCheckoutEvent("error", "stripe_checkout_payment_intent_error", {
      orderId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Unable to initialize Stripe payment. Please try again." },
      { status: 500 },
    );
  }

  if (!paymentIntent.client_secret) {
    await logStripeCheckoutEvent("error", "stripe_checkout_missing_client_secret", {
      orderId,
      paymentIntentId: paymentIntent.id,
    });
    return NextResponse.json(
      { error: "Unable to initialize Stripe payment. Please contact support." },
      { status: 500 },
    );
  }

  const priceMap = new Map(products.map((product) => [product.id, product.priceCents]));
  const latestChargeId =
    typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id;
  const isPaid = paymentIntent.status === "succeeded";
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          userId: session.user.id,
          totalAmount: totals.totalCents,
          paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.PENDING,
          status: isPaid ? OrderStatus.PROCESSING : OrderStatus.PENDING,
          notes: payload.notes,
          currency,
          paymentProvider: PaymentProvider.STRIPE,
          paymentMethod: PaymentMethod.CARD,
          providerRef: paymentIntent.id,
          providerMetadata: {
            paymentIntentStatus: paymentIntent.status,
            latestChargeId,
          },
          contactEmail: payload.contact.email,
          contactPhone: payload.contact.phone,
          shippingAddress: payload.shipping,
          billingAddress: payload.billing,
          locale: payload.locale,
          paidAt: isPaid ? new Date() : undefined,
          events: appendOrderEvent(null, {
            type: "payment_created",
            payload: {
              provider: PaymentProvider.STRIPE,
              method: PaymentMethod.CARD,
              providerRef: paymentIntent.id,
            },
          }) as Prisma.InputJsonValue,
        },
      });

      await tx.orderItem.createMany({
        data: payload.items.map((item) => ({
          orderId: createdOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: priceMap.get(item.productId) ?? 0,
        })),
      });

      return createdOrder;
    });
  } catch (error) {
    console.error("[Stripe] Failed to persist order", error);
    await logStripeCheckoutEvent("error", "stripe_checkout_order_persist_error", {
      orderId,
      paymentIntentId: paymentIntent.id,
    });
    return NextResponse.json(
      { error: "Unable to save order. Please contact support." },
      { status: 500 },
    );
  }

  await logStripeCheckoutEvent("info", "stripe_checkout_order_created", {
    orderId: order.id,
    paymentIntentId: paymentIntent.id,
    totalCents: totals.totalCents,
  });

  try {
    const nameMap = new Map(products.map((product) => [product.id, product.name]));
    const customerName =
      payload.shipping.name || payload.contact.name || session.user.name || "Customer";
    const itemLines = payload.items.map((item) => {
      const name = nameMap.get(item.productId) ?? `Product ${item.productId}`;
      return `- ${name} × ${item.quantity}`;
    });
    const summaryLines = [
      `Order ID: ${order.id}`,
      `Total: €${(totals.totalCents / 100).toFixed(2)}`,
      "Payment method: CARD (Stripe)",
      "",
      "Items:",
      ...itemLines,
    ];

    await sendAdminEmail({
      subject: `New Stripe order ${order.id}`,
      text: formatEmailBlock([
        `Order ID: ${order.id}`,
        `Payment method: STRIPE`,
        `Total: €${(totals.totalCents / 100).toFixed(2)}`,
        `Customer: ${customerName}`,
        `Email: ${payload.contact.email}`,
        payload.contact.phone ? `Phone: ${payload.contact.phone}` : "",
        payload.shipping.city ? `City: ${payload.shipping.city}` : "",
        "",
        "Items:",
        ...itemLines,
      ]),
    });

    if (payload.contact.email) {
      await sendEmail({
        to: payload.contact.email,
        subject: `We received your order ${order.id}`,
        text: formatEmailBlock([
          `Hi ${customerName},`,
          "",
          "Thank you for ordering from Palmanhac!",
          "We are securely processing your card payment with Stripe.",
          "If additional verification is required, please follow the prompts in the card form you just completed.",
          "We’ll send another email as soon as the payment status updates.",
          "",
          ...summaryLines,
          "",
          "You can always review progress in the Orders page.",
        ]),
      });
    }
  } catch (error) {
    if (error instanceof EmailConfigurationError) {
      console.warn("[Email] Order creation notification skipped:", error.message);
    } else {
      console.error("[Email] Failed to send Stripe order email:", error);
    }
  }

  return NextResponse.json({
    orderId: order.id,
    totalCents: totals.totalCents,
    currency,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  });
}
