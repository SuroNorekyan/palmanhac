import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { PaymentMethod, PaymentProvider, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import {
  EmailConfigurationError,
  formatEmailBlock,
  sendAdminEmail,
} from "@/lib/email/mailer";
import {
  createCard,
  createMBWay,
  createMultibanco,
  deriveProviderReference,
  EuPagoAPIError,
  EuPagoConfigurationError,
  normaliseProviderReference,
} from "@/lib/payments/eupago";
import { prisma } from "@/lib/server/db";
import { calculateCartTotals } from "@/lib/utils/cart-totals";
import { normalizeCountryInput } from "@/lib/utils/country";
import { appendOrderEvent } from "@/lib/utils/order-events";
import { logPaymentEvent } from "@/lib/utils/payment-logger";

const countryCodeSchema = z
  .string()
  .min(2)
  .max(120)
  .transform((value, ctx) => {
    try {
      return normalizeCountryInput(value);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Invalid country.",
      });
      return z.NEVER;
    }
  });

const addressSchema = z.object({
  name: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(60),
  country: countryCodeSchema,
});

const payloadSchema = z.object({
  method: z.enum(["multibanco", "mbway", "card"]),
  items: z
    .array(
      z.object({
        productId: z.number().int().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().max(50).optional(),
    name: z.string().max(120).optional(),
  }),
  shipping: addressSchema,
  billing: addressSchema,
  notes: z.string().max(500).optional(),
  currency: z.string().default("EUR"),
  locale: z.string().optional(),
  mbwayPhone: z.string().max(20).optional(),
});

const normalizeCurrency = (currency: string) => currency.trim().toUpperCase() || "EUR";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    await logPaymentEvent("warn", "checkout_invalid_payload", {
      userId: session.user.id,
      issues: parsed.error.flatten(),
    });
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
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
  const orderDescription = `Order ${orderId}`;
  const contactName = payload.contact.name;

  const orderInput = {
    orderId,
    amountCents: totals.totalCents,
    currency,
    description: orderDescription,
    customer: {
      email: payload.contact.email,
      name: contactName ?? payload.shipping.name,
      phone: payload.contact.phone,
    },
    shipping: payload.shipping,
    billing: payload.billing,
    locale: payload.locale,
    metadata: {
      notes: payload.notes,
      userId: session.user.id,
    },
  };

  await logPaymentEvent("info", "checkout_request_received", {
    userId: session.user.id,
    orderId,
    method: payload.method,
    totals,
    currency,
    locale: payload.locale,
  });

  let paymentResult:
    | Awaited<ReturnType<typeof createMultibanco>>
    | Awaited<ReturnType<typeof createMBWay>>
    | Awaited<ReturnType<typeof createCard>>;

  if (process.env.NODE_ENV !== "production") {
    console.debug("[Checkout] Creating EuPago payment", {
      method: payload.method,
      orderId,
      totalCents: totals.totalCents,
      currency,
    });
  }

  try {
    if (payload.method === "multibanco") {
      paymentResult = await createMultibanco(orderInput);
    } else if (payload.method === "mbway") {
      const phone = payload.mbwayPhone?.trim() || payload.contact.phone?.trim();
      if (!phone) {
        return NextResponse.json(
          { error: "MB WAY phone number is required." },
          { status: 400 },
        );
      }
      if (process.env.NODE_ENV !== "production") {
        console.debug("[Checkout] MB WAY payload", {
          orderId,
          amount: orderInput.amountCents / 100,
          phone,
          customer: orderInput.customer,
          locale: orderInput.locale,
        });
      }
      paymentResult = await createMBWay({ ...orderInput, phone });
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[Checkout] Card payload", {
          orderId,
          amount: orderInput.amountCents / 100,
          customer: orderInput.customer,
          returnUrl: process.env.EUPAGO_CARD_RETURN_URL,
          locale: orderInput.locale,
        });
      }
      paymentResult = await createCard(orderInput);
    }
  } catch (error) {
    await logPaymentEvent("error", "checkout_eupago_error", {
      orderId,
      method: payload.method,
      error:
        error instanceof Error ? error.message : "EuPago error (unrecognized payload).",
      response: error instanceof EuPagoAPIError ? error.response : undefined,
    });
    if (error instanceof EuPagoConfigurationError) {
      return NextResponse.json(
        { error: error.message, requiresConfiguration: true },
        { status: 500 },
      );
    }
    if (error instanceof EuPagoAPIError) {
      console.error("[EuPago] API error:", error.message, error.response);
      return NextResponse.json(
        { error: "Unable to initialize EuPago payment. Please try again." },
        { status: 502 },
      );
    }
    console.error("[EuPago] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error starting payment." },
      { status: 500 },
    );
  }

  const paymentLogDetails =
    paymentResult.method === "multibanco"
      ? {
          entity: paymentResult.entity,
          reference: paymentResult.reference,
          amount: paymentResult.amount,
          expiresAt: paymentResult.expiresAt,
        }
      : paymentResult.method === "mbway"
        ? {
            transactionId: paymentResult.transactionId,
            statusUrl: paymentResult.statusUrl,
          }
        : {
            transactionId: paymentResult.transactionId,
            paymentUrl: paymentResult.paymentUrl,
          };

  await logPaymentEvent("info", "checkout_eupago_payment_created", {
    orderId,
    method: paymentResult.method,
    ...paymentLogDetails,
  });

  const providerRef =
    normaliseProviderReference(deriveProviderReference(paymentResult)) ?? orderId;

  const priceMap = new Map(products.map((product) => [product.id, product.priceCents]));
  const orderEventPayload = {
    provider: PaymentProvider.EUPAGO,
    method: paymentResult.method,
    providerRef,
  };
  let order: Awaited<ReturnType<typeof prisma.order.create>>;
  try {
    order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          id: orderId,
          userId: session.user.id,
          totalAmount: totals.totalCents,
          paymentStatus: PaymentStatus.PENDING,
          notes: payload.notes,
          currency,
          paymentProvider: PaymentProvider.EUPAGO,
          paymentMethod:
            paymentResult.method === "multibanco"
              ? PaymentMethod.MULTIBANCO
              : paymentResult.method === "mbway"
                ? PaymentMethod.MBWAY
                : PaymentMethod.CARD,
          providerRef,
          providerMetadata: {
            ...("metadata" in paymentResult ? paymentResult.metadata : {}),
            ...(paymentResult.method === "multibanco"
              ? {
                  entity: paymentResult.entity,
                  reference: paymentResult.reference,
                  amount: paymentResult.amount,
                  expiresAt: paymentResult.expiresAt,
                }
              : {}),
            ...(paymentResult.method === "mbway"
              ? {
                  transactionId: paymentResult.transactionId,
                  statusUrl: paymentResult.statusUrl,
                }
              : {}),
            ...(paymentResult.method === "card"
              ? {
                  transactionId: paymentResult.transactionId,
                  paymentUrl: paymentResult.paymentUrl,
                }
              : {}),
          },
          contactEmail: payload.contact.email,
          contactPhone: payload.contact.phone,
          shippingAddress: payload.shipping,
          billingAddress: payload.billing,
          locale: payload.locale,
          events: appendOrderEvent(null, {
            type: "payment_created",
            payload: {
              ...orderEventPayload,
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
    await logPaymentEvent("error", "checkout_order_persist_error", {
      orderId,
      providerRef,
      error: error instanceof Error ? error.message : "Failed to persist order.",
    });
    console.error("[Order] Failed to create order for EuPago payment", error);
    return NextResponse.json(
      { error: "Unable to save order. Please contact support." },
      { status: 500 },
    );
  }

  await logPaymentEvent("info", "checkout_order_created", {
    orderId: order.id,
    providerRef,
    paymentMethod: paymentResult.method,
    totalCents: order.totalAmount,
  });

  try {
    const nameMap = new Map(products.map((product) => [product.id, product.name]));
    const customerName =
      payload.shipping.name || payload.contact.name || session.user.name || "Customer";
    const itemLines = payload.items.map((item) => {
      const name = nameMap.get(item.productId) ?? `Product ${item.productId}`;
      return `- ${name} × ${item.quantity}`;
    });

    await sendAdminEmail({
      subject: `New order ${order.id}`,
      text: formatEmailBlock([
        `Order ID: ${order.id}`,
        `Payment method: ${paymentResult.method.toUpperCase()}`,
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
  } catch (error) {
    if (error instanceof EmailConfigurationError) {
      console.warn("[Email] Order creation notification skipped:", error.message);
    } else {
      console.error("[Email] Failed to send order creation email:", error);
    }
  }

  const baseResponse = {
    orderId: order.id,
    totalCents: totals.totalCents,
    currency,
  };

  if (paymentResult.method === "multibanco") {
    return NextResponse.json({
      ...baseResponse,
      method: "multibanco" as const,
      entity: paymentResult.entity,
      reference: paymentResult.reference,
      providerAmount: paymentResult.amount,
      expiresAt: paymentResult.expiresAt,
    });
  }

  if (paymentResult.method === "mbway") {
    return NextResponse.json({
      ...baseResponse,
      method: "mbway" as const,
      transactionId: paymentResult.transactionId,
      statusUrl: paymentResult.statusUrl,
    });
  }

  return NextResponse.json({
    ...baseResponse,
    method: "card" as const,
    paymentUrl: paymentResult.paymentUrl,
    transactionId: paymentResult.transactionId,
  });
}
