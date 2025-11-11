import { NextResponse, type NextRequest } from "next/server";
import { PaymentMethod, PaymentProvider, PaymentStatus } from "@prisma/client";
import { auth } from "@/auth";
import {
  EuPagoAPIError,
  EuPagoConfigurationError,
  fetchMBWayStatus,
  fetchMultibancoInfo,
} from "@/lib/payments/eupago";
import { prisma } from "@/lib/server/db";

const normaliseTransactionId = (value: string) => value.replace(/[^0-9A-Za-z_-]/g, "");
const normalizeReferenceDigits = (value: string | null | undefined) =>
  value ? value.replace(/[^0-9]/g, "") : undefined;
const asRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId");
  if (!transactionId) {
    return NextResponse.json({ error: "transactionId is required." }, { status: 400 });
  }

  const candidateRefs = Array.from(
    new Set(
      [transactionId, normaliseTransactionId(transactionId)]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim()),
    ),
  );

  const order = await prisma.order.findFirst({
    where: {
      userId: session.user.id,
      paymentProvider: PaymentProvider.EUPAGO,
      providerRef: { in: candidateRefs },
    },
    select: {
      id: true,
      paymentMethod: true,
      paymentStatus: true,
      providerMetadata: true,
      providerRef: true,
      paidAt: true,
      totalAmount: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const providerMetadata = asRecord(order.providerMetadata);

  if (order.paymentStatus === PaymentStatus.PAID) {
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
        return NextResponse.json({
          status: {
            status: "pending" as const,
            error: "MB WAY status URL unavailable. Await webhook confirmation.",
            raw: providerMetadata,
          },
        });
      }
      const status = await fetchMBWayStatus(statusUrl);
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
    if (error instanceof EuPagoConfigurationError) {
      return NextResponse.json(
        { error: error.message, requiresConfiguration: true },
        { status: 500 },
      );
    }
    if (error instanceof EuPagoAPIError) {
      console.error("[EuPago] Status error:", error.message, error.response);
      return NextResponse.json(
        { error: "Unable to fetch payment status." },
        { status: 502 },
      );
    }
    console.error("[EuPago] Unexpected status error:", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
