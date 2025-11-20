import { NextResponse, type NextRequest } from "next/server";
import {
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { auth } from "@/auth";
import {
  EuPagoAPIError,
  EuPagoConfigurationError,
  fetchMBWayStatus,
  fetchMultibancoInfo,
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
    return;
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
  }
};

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId");
  if (!transactionId) {
    await logStatusEvent("warn", "checkout_status_missing_transaction", {
      userId: session.user.id,
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

  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      paymentProvider: PaymentProvider.EUPAGO,
      providerRef: { in: candidateRefs },
    },
    select: {
      id: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      providerMetadata: true,
      providerRef: true,
      paidAt: true,
      totalAmount: true,
    },
  });

  if (!order) {
    await logStatusEvent("warn", "checkout_status_order_not_found", {
      userId: session.user.id,
      transactionId,
      candidateRefs,
    });
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  await logStatusEvent("info", "checkout_status_request", {
    userId: session.user.id,
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
      if (!statusUrl) {
        await logStatusEvent("warn", "checkout_status_missing_status_url", {
          orderId: order.id,
          providerRef: order.providerRef,
          method: "mbway",
        });
        return NextResponse.json({
          status: {
            status: "pending" as const,
            error: "MB WAY status URL unavailable. Await webhook confirmation.",
            raw: providerMetadata,
          },
        });
      }
      const status = await fetchMBWayStatus(statusUrl);
      await logStatusEvent("info", "checkout_status_polled", {
        orderId: order.id,
        providerRef: order.providerRef,
        method: "mbway",
        status,
      });
      await markOrderStatusFromPayment(order, status);
      return NextResponse.json({ status });
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
      await markOrderStatusFromPayment(order, status);
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
