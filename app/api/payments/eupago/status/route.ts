import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import {
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { auth } from "@/auth";
import { EmailConfigurationError } from "@/lib/email/mailer";
import {
  normalizeMailingAddress,
  sendPaymentConfirmationEmails,
} from "@/lib/email/order-notifications";
import {
  EuPagoAPIError,
  EuPagoConfigurationError,
  fetchMBWayStatus,
  fetchMultibancoInfo,
  lookupReferenceStatus,
  referenceEntryToStatus,
  type EuPagoStatusResult,
} from "@/lib/payments/eupago";
import { prisma } from "@/lib/server/db";
import { logPaymentEvent } from "@/lib/utils/payment-logger";
import { redactForLogging } from "@/lib/utils/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const logStatusEvent = (
  level: Parameters<typeof logPaymentEvent>[0],
  event: string,
  details: Record<string, unknown> = {},
) => logPaymentEvent(level, event, redactForLogging(details) as Record<string, unknown>);

const normaliseTransactionId = (value: string) => value.replace(/[^0-9A-Za-z_-]/g, "");
const normalizeReferenceDigits = (value: string | null | undefined) =>
  value ? value.replace(/[^0-9]/g, "") : undefined;
const asRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const dispatchPaymentEmails = async (
  order: {
    id: string;
    totalAmount: number;
    paymentMethod: PaymentMethod | null;
    contactEmail: string | null;
    contactPhone: string | null;
    taxId: string | null;
    shippingAddress: unknown;
    createdAt: Date;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      product?: { name: string | null };
    }>;
    user?: { name: string | null; email: string | null } | null;
  },
  paidAt: Date,
) => {
  const address = normalizeMailingAddress(order.shippingAddress);
  const emailItems = order.items.map((item) => ({
    name: item.product?.name ?? `Product ${item.productId}`,
    quantity: item.quantity,
    unitPriceCents: item.unitPrice,
  }));
  const customerEmail = order.contactEmail ?? order.user?.email ?? undefined;
  const customerName = order.user?.name || address.name || "Cliente Palmanhac";

  await sendPaymentConfirmationEmails({
    orderId: order.id,
    orderDate: order.createdAt,
    totalCents: order.totalAmount,
    items: emailItems,
    customerName,
    customerEmail,
    customerPhone: order.contactPhone ?? undefined,
    shippingAddress: address,
    taxId: order.taxId ?? undefined,
    paymentDate: paidAt,
    paymentMethod: order.paymentMethod,
  });
};

const markOrderStatusFromPayment = async (
  order: {
    id: string;
    paymentStatus: PaymentStatus;
    status: OrderStatus;
  },
  status: EuPagoStatusResult,
) => {
  if (status.status === "paid" && order.paymentStatus !== PaymentStatus.PAID) {
    const paidAt =
      status.paidAt && !Number.isNaN(Date.parse(status.paidAt))
        ? new Date(status.paidAt)
        : new Date();
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.PROCESSING,
        paidAt,
      },
    });
    await logStatusEvent("info", "checkout_status_marked_paid", {
      orderId: order.id,
      paidAt: paidAt.toISOString(),
    });
    return { changedToPaid: true, paidAt };
  }

  if (
    (status.status === "failed" ||
      status.status === "cancelled" ||
      status.status === "expired") &&
    order.paymentStatus === PaymentStatus.PENDING
  ) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        status: OrderStatus.CANCELLED,
      },
    });
    await logStatusEvent("info", "checkout_status_marked_failed", {
      orderId: order.id,
      paymentStatus: status.status,
    });
    return { changedToPaid: false };
  }

  return { changedToPaid: false };
};

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId");
  const orderIdParam = searchParams.get("orderId") ?? undefined;
  if (!userId && !orderIdParam) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!transactionId) {
    await logStatusEvent("warn", "checkout_status_missing_transaction", {
      userId,
      orderId: orderIdParam,
    });
    return NextResponse.json({ error: "transactionId is required." }, { status: 400 });
  }

  const baseCandidates = [transactionId, normaliseTransactionId(transactionId)].filter(
    (value): value is string => Boolean(value),
  );
  const candidateSet = new Set<string>();
  for (const candidate of baseCandidates) {
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    candidateSet.add(trimmed);
    candidateSet.add(trimmed.toUpperCase());
  }
  const candidateRefs = Array.from(candidateSet);

  const whereClause = {
    paymentProvider: PaymentProvider.EUPAGO,
    providerRef: { in: candidateRefs },
    ...(userId ? { userId } : orderIdParam ? { id: orderIdParam } : {}),
  } satisfies Prisma.OrderWhereInput;

  const order = await prisma.order.findFirst({
    where: whereClause,
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      providerMetadata: true,
      providerRef: true,
      paidAt: true,
      totalAmount: true,
      contactEmail: true,
      contactPhone: true,
      taxId: true,
      shippingAddress: true,
      createdAt: true,
      items: {
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          product: { select: { name: true } },
        },
      },
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!order) {
    await logStatusEvent("warn", "checkout_status_order_not_found", {
      userId,
      transactionId,
      candidateRefs,
      orderId: orderIdParam,
    });
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  await logStatusEvent("info", "checkout_status_request", {
    userId,
    orderId: order.id,
    providerRef: order.providerRef,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    transactionId,
  });

  const providerMetadata = asRecord(order.providerMetadata);

  if (order.paymentStatus === PaymentStatus.PAID) {
    await logStatusEvent("info", "checkout_status_cached_paid", {
      orderId: order.id,
      providerRef: order.providerRef,
    });
    return NextResponse.json({
      status: {
        status: "paid" as const,
        paidAt: order.paidAt ? order.paidAt.toISOString() : undefined,
        raw: {
          paymentStatus: order.paymentStatus,
          providerRef: order.providerRef,
        },
      },
    });
  }

  try {
    if (order.paymentMethod === PaymentMethod.MBWAY) {
      const statusUrl =
        asString(providerMetadata.statusUrl) ?? asString(providerMetadata.status_url);
      const metadataReference =
        normalizeReferenceDigits(
          asString(providerMetadata.reference) ??
            asString(providerMetadata.referencia) ??
            undefined,
        ) ?? normalizeReferenceDigits(order.providerRef);

      const fetchReferenceStatus = async () => {
        if (!metadataReference) return null;
        const entry = await lookupReferenceStatus(metadataReference);
        const normalizedStatus = referenceEntryToStatus(entry);
        if (normalizedStatus) {
          await logStatusEvent("info", "checkout_status_reference_match", {
            orderId: order.id,
            providerRef: order.providerRef,
            reference: metadataReference,
            upstreamStatus: entry?.status,
          });
        }
        return normalizedStatus;
      };

      const handleStatusResult = async (status: EuPagoStatusResult | null) => {
        if (!status) {
          return NextResponse.json({
            status: {
              status: "pending" as const,
              error: "Unable to retrieve MB WAY status at this time.",
              raw: providerMetadata,
            },
          });
        }
        await logStatusEvent("info", "checkout_status_polled", {
          orderId: order.id,
          providerRef: order.providerRef,
          method: "mbway",
          status,
        });
        const updateResult = await markOrderStatusFromPayment(order, status);
        if (updateResult.changedToPaid) {
          try {
            await dispatchPaymentEmails(order, updateResult.paidAt ?? new Date());
          } catch (error) {
            if (error instanceof EmailConfigurationError) {
              await logStatusEvent("warn", "checkout_status_email_skipped", {
                orderId: order.id,
                reason: error.message,
              });
            } else {
              await logStatusEvent("error", "checkout_status_email_failed", {
                orderId: order.id,
                error: error instanceof Error ? error.message : "Unknown email error",
              });
            }
          }
        }
        return NextResponse.json({ status });
      };

      if (statusUrl) {
        try {
          const status = await fetchMBWayStatus(statusUrl);
          return handleStatusResult(status);
        } catch (error) {
          await logStatusEvent("warn", "checkout_status_mbway_statusurl_failed", {
            orderId: order.id,
            providerRef: order.providerRef,
            method: "mbway",
            error: error instanceof Error ? error.message : "Unknown status error",
          });
          const fallbackStatus = await fetchReferenceStatus().catch(
            async (referenceError) => {
              await logStatusEvent("error", "checkout_status_reference_error", {
                orderId: order.id,
                providerRef: order.providerRef,
                reference: metadataReference,
                error:
                  referenceError instanceof Error
                    ? referenceError.message
                    : "Unknown reference error",
              });
              return null;
            },
          );
          if (fallbackStatus) {
            return handleStatusResult(fallbackStatus);
          }
          throw error;
        }
      }

      if (!metadataReference) {
        await logStatusEvent("warn", "checkout_status_missing_status_url", {
          orderId: order.id,
          providerRef: order.providerRef,
          method: "mbway",
        });
        return NextResponse.json({
          status: {
            status: "pending" as const,
            error: "MB WAY status unavailable. Await webhook confirmation.",
            raw: providerMetadata,
          },
        });
      }

      const referenceStatus = await fetchReferenceStatus().catch(
        async (referenceError) => {
          await logStatusEvent("error", "checkout_status_reference_error", {
            orderId: order.id,
            providerRef: order.providerRef,
            reference: metadataReference,
            error:
              referenceError instanceof Error
                ? referenceError.message
                : "Unknown reference error",
          });
          return null;
        },
      );
      return handleStatusResult(referenceStatus);
    }

    if (order.paymentMethod === PaymentMethod.MULTIBANCO) {
      const reference =
        normalizeReferenceDigits(
          asString(providerMetadata.reference) ??
            asString(providerMetadata.referencia) ??
            order.providerRef ??
            transactionId,
        ) ?? normalizeReferenceDigits(transactionId);

      if (!reference) {
        await logStatusEvent("warn", "checkout_status_missing_reference", {
          orderId: order.id,
          providerRef: order.providerRef,
          transactionId,
        });
        return NextResponse.json({
          status: {
            status: "pending" as const,
            error: "Multibanco reference unavailable. Await webhook confirmation.",
            raw: providerMetadata,
          },
        });
      }

      const entity = normalizeReferenceDigits(
        asString(providerMetadata.entity) ?? asString(providerMetadata.entidade),
      );

      const amountRaw =
        providerMetadata.amount ?? providerMetadata.value ?? providerMetadata.valor;
      let amount: number | undefined;
      if (typeof amountRaw === "number") {
        amount = amountRaw;
      } else if (typeof amountRaw === "string") {
        const parsed = Number.parseFloat(amountRaw.replace(",", "."));
        if (Number.isFinite(parsed)) {
          amount = parsed;
        }
      }
      if (amount === undefined && typeof order.totalAmount === "number") {
        amount = Number((order.totalAmount / 100).toFixed(2));
      }

      const status = await fetchMultibancoInfo({
        reference,
        entity,
        orderId: order.id,
        transactionId: transactionId,
        amount,
      });
      await logStatusEvent("info", "checkout_status_polled", {
        orderId: order.id,
        providerRef: order.providerRef,
        method: "multibanco",
        status,
      });
      const updateResult = await markOrderStatusFromPayment(order, status);
      if (updateResult.changedToPaid) {
        try {
          await dispatchPaymentEmails(order, updateResult.paidAt ?? new Date());
        } catch (error) {
          if (error instanceof EmailConfigurationError) {
            await logStatusEvent("warn", "checkout_status_email_skipped", {
              orderId: order.id,
              reason: error.message,
            });
          } else {
            await logStatusEvent("error", "checkout_status_email_failed", {
              orderId: order.id,
              error: error instanceof Error ? error.message : "Unknown email error",
            });
          }
        }
      }
      return NextResponse.json({ status });
    }

    return NextResponse.json({
      status: {
        status: "pending" as const,
        error:
          "Status polling is not available for this payment method. Await return URL or webhook.",
        raw: {
          paymentMethod: order.paymentMethod,
          providerRef: order.providerRef,
        },
      },
    });
  } catch (error) {
    await logStatusEvent("error", "checkout_status_error", {
      orderId: order.id,
      providerRef: order.providerRef,
      error: error instanceof Error ? error.message : "Unknown status error.",
    });
    if (error instanceof EuPagoConfigurationError) {
      return NextResponse.json(
        { error: error.message, requiresConfiguration: true },
        { status: 500 },
      );
    }
    if (error instanceof EuPagoAPIError) {
      console.error("[EuPago] Status error:", error.message);
      return NextResponse.json(
        { error: "Unable to fetch payment status." },
        { status: 502 },
      );
    }
    console.error("[EuPago] Unexpected status error:", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
