import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { PaymentMethod, PaymentProvider, PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import { EmailConfigurationError } from "@/lib/email/mailer";
import {
  sendOrderCreationNotifications,
  type BilingualInstructions,
} from "@/lib/email/order-notifications";
import {
  checkoutPayloadSchema,
  normalizeCurrency,
  parseMbwayPhone,
} from "@/lib/payments/checkout-schema";
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
import { appendOrderEvent } from "@/lib/utils/order-events";
import { logPaymentEvent } from "@/lib/utils/payment-logger";
import { redactForLogging } from "@/lib/utils/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const logCheckoutEvent = (
  level: Parameters<typeof logPaymentEvent>[0],
  event: string,
  details: Record<string, unknown> = {},
) => logPaymentEvent(level, event, redactForLogging(details) as Record<string, unknown>);

type EuPagoPaymentResult =
  | Awaited<ReturnType<typeof createMultibanco>>
  | Awaited<ReturnType<typeof createMBWay>>
  | Awaited<ReturnType<typeof createCard>>;

const formatEuroFromCents = (cents: number) => `€${(cents / 100).toFixed(2)}`;

const formatEuPagoAmount = (amount: number | undefined, totalCents: number) => {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return `€${amount.toFixed(2)}`;
  }
  return formatEuroFromCents(totalCents);
};

const buildEupagoInstructions = (
  result: EuPagoPaymentResult,
  totalCents: number,
): BilingualInstructions | undefined => {
  if (result.method === "multibanco") {
    const amount = formatEuPagoAmount(result.amount, totalCents);
    return {
      pt: [
        "Como concluir o pagamento via Multibanco:",
        `Entidade: ${result.entity}`,
        `Referência: ${result.reference}`,
        `Valor: ${amount}`,
        result.expiresAt ? `Disponível até: ${result.expiresAt}` : "",
        "Finalize o pagamento num terminal Multibanco ou no seu banco online para confirmar a encomenda.",
      ],
      en: [
        "How to finish your Multibanco payment:",
        `Entity: ${result.entity}`,
        `Reference: ${result.reference}`,
        `Amount: ${amount}`,
        result.expiresAt ? `Expires on: ${result.expiresAt}` : "",
        "Complete the payment at an ATM or via your online banking to confirm the order.",
      ],
    };
  }

  if (result.method === "mbway") {
    return {
      pt: [
        "Abra a app MB WAY e confirme o pedido que acabou de receber.",
        `ID da transação: ${result.transactionId}`,
        result.statusUrl ? `Estado em tempo real: ${result.statusUrl}` : "",
      ],
      en: [
        "Open your MB WAY app and approve the request we just sent.",
        `Transaction ID: ${result.transactionId}`,
        result.statusUrl ? `Live status: ${result.statusUrl}` : "",
      ],
    };
  }

  if (result.method === "card") {
    return {
      pt: [
        "Conclua o pagamento com cartão através da página segura que abriu no browser.",
        "Caso a janela tenha sido fechada, utilize o link mostrado no checkout para voltar a abri-la.",
      ],
      en: [
        "Finish the secure card payment in the page that just opened in your browser.",
        "If you closed the window, reopen the link provided on the checkout page to continue.",
      ],
    };
  }

  return undefined;
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutPayloadSchema.safeParse(body);
  if (!parsed.success) {
    await logCheckoutEvent("warn", "checkout_invalid_payload", {
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

  await logCheckoutEvent("info", "checkout_request_received", {
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
    await logCheckoutEvent("debug", "checkout_payment_attempt", {
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
      let parsedPhone: { phone: string; countryCode: string };
      try {
        parsedPhone = parseMbwayPhone(phone);
      } catch {
        return NextResponse.json(
          {
            error:
              "Please provide a valid MB WAY phone number (include country code, e.g. +351912345678).",
          },
          { status: 400 },
        );
      }
      if (process.env.NODE_ENV !== "production") {
        await logCheckoutEvent("debug", "checkout_mbway_payload", {
          orderId,
          amount: orderInput.amountCents / 100,
          phone: parsedPhone,
          customer: orderInput.customer,
          locale: orderInput.locale,
        });
      }
      paymentResult = await createMBWay({
        ...orderInput,
        phone: parsedPhone.phone,
        countryCode: parsedPhone.countryCode,
      });
    } else {
      if (process.env.NODE_ENV !== "production") {
        await logCheckoutEvent("debug", "checkout_card_payload", {
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
    await logCheckoutEvent("error", "checkout_eupago_error", {
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
      console.error("[EuPago] API error:", error.message);
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

  await logCheckoutEvent("info", "checkout_eupago_payment_created", {
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
          taxId: payload.taxId,
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
    await logCheckoutEvent("error", "checkout_order_persist_error", {
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

  await logCheckoutEvent("info", "checkout_order_created", {
    orderId: order.id,
    providerRef,
    paymentMethod: paymentResult.method,
    totalCents: order.totalAmount,
  });

  try {
    const nameMap = new Map(products.map((product) => [product.id, product.name]));
    const customerName =
      payload.shipping.name || payload.contact.name || session.user.name || "Customer";
    const itemSummaries = payload.items.map((item) => ({
      name: nameMap.get(item.productId) ?? `Product ${item.productId}`,
      quantity: item.quantity,
    }));
    const paymentSummary =
      paymentResult.method === "multibanco"
        ? "MULTIBANCO (EuPago)"
        : paymentResult.method === "mbway"
          ? "MB WAY (EuPago)"
          : "CARD (EuPago)";

    await sendOrderCreationNotifications({
      orderId: order.id,
      totalCents: totals.totalCents,
      items: itemSummaries,
      customerName,
      customerEmail: payload.contact.email,
      customerPhone: payload.contact.phone,
      shippingCity: payload.shipping.city,
      paymentSummary,
      nif: payload.taxId,
      notes: payload.notes,
      methodInstructions: buildEupagoInstructions(paymentResult, totals.totalCents),
      adminSubject: `New order ${order.id}`,
      customerSubject: `We received your order ${order.id}`,
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
