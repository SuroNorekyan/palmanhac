import { NextResponse, type NextRequest } from "next/server";
import { PaymentIntentStatus, PaymentProvider } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/db";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
  provider: z.nativeEnum(PaymentProvider).default("OTHER"),
  currency: z.string().default("EUR"),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { items, provider, currency, notes } = parsed.data;
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, priceCents: true },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One or more products not found." },
      { status: 404 },
    );
  }

  const priceMap = new Map(products.map((product) => [product.id, product.priceCents]));
  const totalAmount = items.reduce((acc, item) => {
    const price = priceMap.get(item.productId) ?? 0;
    return acc + price * item.quantity;
  }, 0);

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId: session.user.id,
        totalAmount,
        notes,
      },
    });

    await tx.orderItem.createMany({
      data: items.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: priceMap.get(item.productId) ?? 0,
      })),
    });

    const paymentIntent = await tx.paymentIntent.create({
      data: {
        orderId: createdOrder.id,
        provider,
        status: PaymentIntentStatus.PROCESSING,
        amount: totalAmount,
        currency,
        metadata: {
          mock: true,
        },
      },
    });

    return { createdOrder, paymentIntent };
  });

  return NextResponse.json({
    orderId: order.createdOrder.id,
    paymentIntentId: order.paymentIntent.id,
    amount: totalAmount,
    currency,
    provider,
    status: order.paymentIntent.status,
  });
}
