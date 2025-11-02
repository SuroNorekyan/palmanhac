import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { PaymentStatus } from "@prisma/client";
import {
  EmailConfigurationError,
  formatEmailBlock,
  sendAdminEmail,
} from "@/lib/email/mailer";
import { normaliseProviderReference } from "@/lib/payments/eupago";
import { prisma } from "@/lib/server/db";
import { appendOrderEvent } from "@/lib/utils/order-events";

const getSignature = (request: NextRequest) => {
  const header =
    request.headers.get("x-eupago-signature") ??
    request.headers.get("x-signature") ??
    undefined;
  if (header) {
    return header.trim();
  }
  const url = new URL(request.url);
  return url.searchParams.get("signature") ?? undefined;
};

const signaturesMatch = (incoming: string, expected: string) => {
  const incomingBuffer = Buffer.from(incoming, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (incomingBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(incomingBuffer, expectedBuffer);
};

const deriveStatus = (payload: Record<string, unknown>) => {
  const statusRaw = (payload.status ??
    payload.state ??
    payload.payment_status ??
    payload.result ??
    "") as string;
  const status = typeof statusRaw === "string" ? statusRaw.toLowerCase() : "";
  if (status.includes("paid") || status.includes("success") || status === "ok") {
    return "paid";
  }
  if (status.includes("fail") || status.includes("error")) {
    return "failed";
  }
  if (status.includes("cancel")) {
    return "cancelled";
  }
  if (status.includes("expir")) {
    return "expired";
  }
  return status || "unknown";
};

const extractPaidAt = (payload: Record<string, unknown>) => {
  const paidAtCandidate =
    (payload.paid_at as string | undefined) ??
    (payload.payment_date as string | undefined) ??
    (payload.processed_at as string | undefined);
  if (!paidAtCandidate) {
    return undefined;
  }
  const parsed = new Date(paidAtCandidate);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
};

const extractProviderRef = (payload: Record<string, unknown>) => {
  const rawRef =
    (payload.transaction_id as string | undefined) ??
    (payload.transactionId as string | undefined) ??
    (payload.reference as string | undefined) ??
    (payload.referencia as string | undefined) ??
    (payload.mbway_id as string | undefined) ??
    (payload.id as string | undefined) ??
    (payload.order_id as string | undefined);

  if (!rawRef) {
    return undefined;
  }

  const normalized = normaliseProviderReference(rawRef);
  return normalized ?? rawRef;
};

export async function POST(request: NextRequest) {
  const secret = process.env.EUPAGO_WEBHOOK_SHARED_SECRET;
  if (!secret) {
    console.error("[EuPago] Webhook secret is not configured.");
    return NextResponse.json({ error: "Webhook secret missing." }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!rawBody) {
    return NextResponse.json({ error: "Empty payload." }, { status: 400 });
  }

  const signature = getSignature(request);
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!signaturesMatch(signature, expectedSignature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch (error) {
    console.error("[EuPago] Failed to parse webhook payload:", error);
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const providerRef = extractProviderRef(payload);
  if (!providerRef) {
    console.error("[EuPago] Webhook missing provider reference.", payload);
    return NextResponse.json({ error: "Missing provider reference." }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { providerRef },
    select: {
      id: true,
      paymentStatus: true,
      paidAt: true,
      events: true,
      totalAmount: true,
      paymentMethod: true,
      contactEmail: true,
      user: {
        select: { name: true, email: true },
      },
    },
  });

  if (!order) {
    console.warn("[EuPago] Order not found for providerRef:", providerRef);
    return NextResponse.json({ success: true });
  }

  const status = deriveStatus(payload);
  const baseEvents = appendOrderEvent(order.events, {
    type: "eupago_webhook_received",
    payload: { status, ...payload },
  });

  if (order.paymentStatus === PaymentStatus.PAID) {
    await prisma.order.update({
      where: { id: order.id },
      data: { events: baseEvents as Prisma.InputJsonValue },
    });
    return NextResponse.json({ success: true });
  }

  const paidAt = extractPaidAt(payload) ?? new Date();

  if (status === "paid") {
    const updatedOrder = (await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        paidAt,
        events: appendOrderEvent(baseEvents, {
          type: "payment_captured",
          payload: {
            providerRef,
            paidAt: paidAt.toISOString(),
          },
        }) as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })) as Prisma.OrderGetPayload<{
      include: { user: { select: { name: true; email: true } } };
    }>;

    try {
      await sendAdminEmail({
        subject: `Payment confirmed ${updatedOrder.id}`,
        text: formatEmailBlock([
          `Order ID: ${updatedOrder.id}`,
          `Status: ${updatedOrder.paymentStatus}`,
          `Method: ${updatedOrder.paymentMethod ?? "—"}`,
          `Total: €${(updatedOrder.totalAmount / 100).toFixed(2)}`,
          updatedOrder.paidAt
            ? `Paid at: ${updatedOrder.paidAt.toISOString()}`
            : "Paid at: not provided",
          `Customer: ${updatedOrder.user?.name ?? "Customer"}`,
          `Email: ${updatedOrder.contactEmail ?? updatedOrder.user?.email ?? "—"}`,
        ]),
      });
    } catch (error) {
      if (error instanceof EmailConfigurationError) {
        console.warn("[Email] Payment confirmation notification skipped:", error.message);
      } else {
        console.error("[Email] Failed to send payment confirmation email:", error);
      }
    }

    return NextResponse.json({ success: true });
  }

  if (status === "failed") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        events: appendOrderEvent(baseEvents, {
          type: "payment_failed",
          payload: { providerRef },
        }) as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (status === "cancelled" || status === "expired") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus:
          status === "cancelled" ? PaymentStatus.FAILED : PaymentStatus.UNPAID,
        events: appendOrderEvent(baseEvents, {
          type: `payment_${status}`,
          payload: { providerRef },
        }) as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ success: true });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { events: baseEvents as Prisma.InputJsonValue },
  });

  return NextResponse.json({ success: true });
}
