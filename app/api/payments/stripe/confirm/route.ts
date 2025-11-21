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
import { EmailConfigurationError } from "@/lib/email/mailer";
import {
  normalizeMailingAddress,
  sendPaymentConfirmationEmails,
} from "@/lib/email/order-notifications";
import { getStripeClient } from "@/lib/payments/stripe";
import { prisma } from "@/lib/server/db";
import { appendOrderEvent } from "@/lib/utils/order-events";
import { logPaymentEvent } from "@/lib/utils/payment-logger";
import { redactForLogging } from "@/lib/utils/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConfirmPayload = {
  orderId?: string;
  paymentIntentId?: string;
};

const logStripeConfirmEvent = (
  level: Parameters<typeof logPaymentEvent>[0],
  event: string,
  details: Record<string, unknown> = {},
) => logPaymentEvent(level, event, redactForLogging(details) as Record<string, unknown>);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as ConfirmPayload | null;
  if (!payload?.orderId || !payload?.paymentIntentId) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
    select: {
      id: true,
      userId: true,
      paymentProvider: true,
      paymentStatus: true,
      providerRef: true,
      events: true,
      totalAmount: true,
      contactEmail: true,
      contactPhone: true,
      taxId: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          product: { select: { name: true } },
        },
      },
      shippingAddress: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.paymentProvider !== PaymentProvider.STRIPE) {
    return NextResponse.json(
      { error: "Order is not a Stripe payment." },
      { status: 400 },
    );
  }

  if (order.providerRef !== payload.paymentIntentId) {
    return NextResponse.json({ error: "Payment reference mismatch." }, { status: 400 });
  }

  if (order.paymentStatus === PaymentStatus.PAID) {
    return NextResponse.json({ success: true, alreadyPaid: true });
  }

  const stripe = getStripeClient();
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(payload.paymentIntentId);
  } catch (error) {
    console.error("[Stripe] Failed to load payment intent", error);
    await logStripeConfirmEvent("error", "stripe_confirm_payment_intent_error", {
      orderId: order.id,
      paymentIntentId: payload.paymentIntentId,
    });
    return NextResponse.json(
      { error: "Unable to validate payment. Please try again." },
      { status: 502 },
    );
  }

  if (paymentIntent.status !== "succeeded") {
    await logStripeConfirmEvent("warn", "stripe_confirm_payment_not_succeeded", {
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
    return NextResponse.json(
      { error: "Payment not completed.", status: paymentIntent.status },
      { status: 409 },
    );
  }

  const paidAt =
    paymentIntent.created && Number.isInteger(paymentIntent.created)
      ? new Date(paymentIntent.created * 1000)
      : new Date();
  const latestChargeId =
    typeof paymentIntent.latest_charge === "string"
      ? paymentIntent.latest_charge
      : paymentIntent.latest_charge?.id;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: PaymentStatus.PAID,
      status: OrderStatus.PROCESSING,
      paidAt,
      providerMetadata: {
        paymentIntentStatus: paymentIntent.status,
        latestChargeId,
      },
      events: appendOrderEvent(order.events, {
        type: "payment_confirmed",
        payload: {
          provider: PaymentProvider.STRIPE,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        },
      }) as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      totalAmount: true,
      shippingAddress: true,
      contactEmail: true,
      contactPhone: true,
      taxId: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          product: { select: { name: true } },
        },
      },
    },
  });

  await logStripeConfirmEvent("info", "stripe_confirm_payment_success", {
    orderId: updated.id,
    paymentIntentId: paymentIntent.id,
    totalCents: updated.totalAmount,
  });

  try {
    const normalizedAddress = normalizeMailingAddress(updated.shippingAddress);
    const emailItems = updated.items.map((item) => ({
      name: item.product?.name ?? `Product ${item.productId}`,
      quantity: item.quantity,
      unitPriceCents: item.unitPrice,
    }));
    const customerEmail =
      updated.contactEmail ??
      order.contactEmail ??
      order.user?.email ??
      session.user.email ??
      undefined;
    const customerName =
      order.user?.name ||
      normalizedAddress.name ||
      session.user.name ||
      "Cliente Palmanhac";

    await sendPaymentConfirmationEmails({
      orderId: updated.id,
      orderDate: order.createdAt,
      totalCents: updated.totalAmount,
      items: emailItems,
      customerName,
      customerEmail,
      customerPhone: updated.contactPhone ?? order.contactPhone ?? undefined,
      shippingAddress: normalizedAddress,
      taxId: order.taxId ?? undefined,
      paymentDate: paidAt,
      paymentMethod: PaymentMethod.CARD,
    });
  } catch (error) {
    if (error instanceof EmailConfigurationError) {
      console.warn("[Email] Payment confirmation notification skipped:", error.message);
    } else {
      console.error("[Email] Failed to send Stripe success email:", error);
    }
  }

  return NextResponse.json({ success: true });
}
