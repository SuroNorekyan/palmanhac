import { NextResponse, type NextRequest } from "next/server";
import { PaymentMethod, PaymentStatus, type Prisma } from "@prisma/client";
import { requireAdminSession } from "@/lib/auth/guards";
import { EmailConfigurationError } from "@/lib/email/mailer";
import {
  normalizeMailingAddress,
  sendPaymentConfirmationEmails,
} from "@/lib/email/order-notifications";
import {
  lookupReferenceStatus,
  normaliseProviderReference,
  referenceEntryToStatus,
} from "@/lib/payments/eupago";
import { prisma } from "@/lib/server/db";
import { appendOrderEvent } from "@/lib/utils/order-events";

const asRecord = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const toOrderWhere = (code: string) => {
  const candidates: Prisma.OrderWhereInput[] = [];
  const trimmed = code.trim();
  if (!trimmed) return { id: "___never___" };
  const normalizedId = trimmed.toLowerCase();
  candidates.push({ id: normalizedId });
  candidates.push({ id: { startsWith: normalizedId } });
  const providerRef = normaliseProviderReference(trimmed);
  if (providerRef) {
    candidates.push({ providerRef });
  }
  return { OR: candidates };
};

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

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "code is required." }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: toOrderWhere(code),
      select: {
        id: true,
        paymentStatus: true,
        paymentMethod: true,
        providerRef: true,
        providerMetadata: true,
        events: true,
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
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const providerMetadata = asRecord(order.providerMetadata);
    let remoteStatus = null;

    if (order.paymentMethod === PaymentMethod.MBWAY) {
      const referenceCandidates = Array.from(
        new Set(
          [
            asString(providerMetadata.reference),
            asString(providerMetadata.referencia),
            asString(providerMetadata.identifier),
            asString(providerMetadata.transactionId),
            asString(providerMetadata.transaction_id),
            order.providerRef,
            order.id,
          ].filter((value): value is string => Boolean(value && value.trim())),
        ),
      );
      if (referenceCandidates.length) {
        const entry = await lookupReferenceStatus(referenceCandidates);
        remoteStatus = referenceEntryToStatus(entry);
      }
    }

    let paidAt: Date | undefined;
    if (remoteStatus?.paidAt) {
      const parsed = Date.parse(remoteStatus.paidAt);
      paidAt = Number.isNaN(parsed) ? undefined : new Date(parsed);
    }

    let updatePayload: Record<string, unknown> | null = null;

    if (remoteStatus?.status === "paid" && order.paymentStatus !== PaymentStatus.PAID) {
      const finalPaidAt = paidAt ?? new Date();
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: finalPaidAt,
          events: appendOrderEvent(order.events, {
            type: "admin_payment_sync",
            payload: {
              source: "references_by_status",
              status: remoteStatus.status,
              paidAt: finalPaidAt.toISOString(),
            },
          }) as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          totalAmount: true,
          paymentMethod: true,
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
      try {
        await dispatchPaymentEmails(updated, finalPaidAt);
      } catch (error) {
        if (error instanceof EmailConfigurationError) {
          console.warn("[Admin] Payment confirmation email skipped:", error.message);
        } else {
          console.error("[Admin] Failed to send payment confirmation email:", error);
        }
      }
      updatePayload = {
        paymentStatus: PaymentStatus.PAID,
        paidAt: finalPaidAt.toISOString(),
      };
    }

    return NextResponse.json({
      order: {
        id: order.id,
        paymentStatus: updatePayload?.paymentStatus ?? order.paymentStatus,
        paymentMethod: order.paymentMethod,
        providerRef: order.providerRef,
      },
      eupagoStatus: remoteStatus ?? { status: "unknown" },
      updated: updatePayload,
    });
  } catch (error) {
    console.error("[Admin] Failed to refresh EuPago order status.", error);
    return NextResponse.json(
      { error: "Unable to refresh EuPago status." },
      { status: 500 },
    );
  }
}
