import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { PaymentStatus } from "@prisma/client";
import {
  EmailConfigurationError,
  formatEmailBlock,
  sendAdminEmail,
  sendEmail,
} from "@/lib/email/mailer";
import { normaliseProviderReference } from "@/lib/payments/eupago";
import { prisma } from "@/lib/server/db";
import { appendOrderEvent } from "@/lib/utils/order-events";
import { logPaymentEvent } from "@/lib/utils/payment-logger";
import { redactForLogging } from "@/lib/utils/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const logWebhookEvent = (
  level: Parameters<typeof logPaymentEvent>[0],
  event: string,
  details: Record<string, unknown> = {},
) => logPaymentEvent(level, event, redactForLogging(details) as Record<string, unknown>);

/**
 * EuPago sandbox setup:
 * - Configure Webhooks 2.0 endpoint to
 *   https://send-surgery-arrives-regular.trycloudflare.com/api/payments/eupago/webhook
 * - Use the generated Cryptographic Key as EUPAGO_WEBHOOK_SHARED_SECRET.
 */

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
    await logWebhookEvent("error", "eupago_webhook_secret_missing");
    return NextResponse.json({ error: "Webhook secret missing." }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!rawBody) {
    await logWebhookEvent("warn", "eupago_webhook_empty_payload");
    return NextResponse.json({ error: "Empty payload." }, { status: 400 });
  }

  const signature = getSignature(request);
  if (!signature) {
    await logWebhookEvent("warn", "eupago_webhook_missing_signature");
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!signaturesMatch(signature, expectedSignature)) {
    await logWebhookEvent("warn", "eupago_webhook_invalid_signature", {
      signature: `${signature.slice(0, 8)}...`,
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  await logWebhookEvent("info", "eupago_webhook_verified", {
    signature: `${signature.slice(0, 8)}...`,
    rawBodyLength: rawBody.length,
  });

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch (error) {
    console.error("[EuPago] Failed to parse webhook payload:", error);
    await logWebhookEvent("error", "eupago_webhook_invalid_json", {
      error: error instanceof Error ? error.message : "Invalid JSON",
    });
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const providerRef = extractProviderRef(payload);
  if (!providerRef) {
    console.error("[EuPago] Webhook missing provider reference.");
    await logWebhookEvent("error", "eupago_webhook_missing_provider_ref", {
      payload,
    });
    return NextResponse.json({ error: "Missing provider reference." }, { status: 400 });
  }

  const status = deriveStatus(payload);
  await logWebhookEvent("info", "eupago_webhook_payload_parsed", {
    providerRef,
    status,
    payload,
  });

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
    console.warn("[EuPago] Order not found for providerRef.");
    await logWebhookEvent("warn", "eupago_webhook_order_not_found", {
      providerRef,
      payload,
    });
    return NextResponse.json({ success: true });
  }

  const baseEvents = appendOrderEvent(order.events, {
    type: "eupago_webhook_received",
    payload: { status, ...payload },
  });

  if (order.paymentStatus === PaymentStatus.PAID) {
    await prisma.order.update({
      where: { id: order.id },
      data: { events: baseEvents as Prisma.InputJsonValue },
    });
    await logWebhookEvent("info", "eupago_webhook_already_paid", {
      orderId: order.id,
      providerRef,
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
    await logWebhookEvent("info", "eupago_webhook_payment_captured", {
      orderId: updatedOrder.id,
      providerRef,
      paidAt: paidAt.toISOString(),
    });

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

      const customerEmail =
        updatedOrder.contactEmail ?? updatedOrder.user?.email ?? undefined;
      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `Payment confirmed for order ${updatedOrder.id}`,
          text: formatEmailBlock([
            `Olá ${updatedOrder.user?.name ?? "cliente"},`,
            "",
            "Recebemos o pagamento da sua encomenda Palmanhac e estamos a preparar o envio.",
            `Total: €${(updatedOrder.totalAmount / 100).toFixed(2)}`,
            updatedOrder.paidAt
              ? `Confirmado em: ${updatedOrder.paidAt.toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}`
              : "",
            "",
            "Pode acompanhar o estado da encomenda na área de Encomendas.",
          ]),
        });
      }
    } catch (error) {
      if (error instanceof EmailConfigurationError) {
        console.warn("[Email] Payment confirmation notification skipped:", error.message);
        await logWebhookEvent("warn", "eupago_webhook_email_skipped", {
          orderId: order.id,
          providerRef,
          error: error.message,
        });
      } else {
        console.error("[Email] Failed to send payment confirmation email:", error);
        await logWebhookEvent("error", "eupago_webhook_email_failed", {
          orderId: order.id,
          providerRef,
          error: error instanceof Error ? error.message : "Unknown email error",
        });
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
    await logWebhookEvent("warn", "eupago_webhook_payment_failed", {
      orderId: order.id,
      providerRef,
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
    await logWebhookEvent("info", "eupago_webhook_payment_status_update", {
      orderId: order.id,
      providerRef,
      status,
    });
    return NextResponse.json({ success: true });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { events: baseEvents as Prisma.InputJsonValue },
  });
  await logWebhookEvent("info", "eupago_webhook_event_recorded", {
    orderId: order.id,
    providerRef,
    status,
  });

  return NextResponse.json({ success: true });
}
