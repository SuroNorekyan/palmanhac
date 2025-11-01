import { NextResponse, type NextRequest } from "next/server";
import { PaymentIntentStatus, PaymentProvider, PaymentStatus } from "@prisma/client";
import Stripe from "stripe";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/server/db";
import { calculateCartTotals } from "@/lib/utils/cart-totals";

const addressSchema = z.object({
  name: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(60),
  country: z.string().min(2).max(120),
});

const payloadSchema = z.object({
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
  }),
  shipping: addressSchema,
  billing: addressSchema,
  notes: z.string().max(500).optional(),
  currency: z.string().default("EUR"),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const productIds = payload.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      priceCents: true,
      name: true,
    },
  });

  if (products.length !== new Set(productIds).size) {
    return NextResponse.json(
      { error: "One or more products are not available." },
      { status: 404 },
    );
  }

  const totals = calculateCartTotals(payload.items, products);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json(
      {
        error: "Stripe secret key is not configured.",
        requiresConfiguration: true,
        amount: totals.totalCents,
        currency: payload.currency ?? "EUR",
      },
      { status: 500 },
    );
  }

  const currency = (payload.currency ?? "EUR").toUpperCase();
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  });

  const order = await prisma.$transaction(async (tx) => {
    const createdOrder = await tx.order.create({
      data: {
        userId: session.user.id,
        totalAmount: totals.totalCents,
        paymentStatus: PaymentStatus.PENDING,
        notes: payload.notes,
      },
    });

    const priceMap = new Map(products.map((product) => [product.id, product.priceCents]));
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

  const normalizedCountry =
    payload.shipping.country.length === 2
      ? payload.shipping.country.toUpperCase()
      : undefined;
  const phone = payload.contact.phone?.trim() || undefined;

  const stripeIntent = await stripe.paymentIntents.create({
    amount: totals.totalCents,
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order.id,
      userId: session.user.id,
      locale: payload.locale ?? "",
    },
    receipt_email: payload.contact.email,
    shipping: {
      name: payload.shipping.name,
      address: {
        line1: payload.shipping.line1,
        line2: payload.shipping.line2 ?? undefined,
        city: payload.shipping.city,
        postal_code: payload.shipping.postalCode,
        country: normalizedCountry,
      },
      phone,
    },
  });

  if (!stripeIntent.client_secret) {
    return NextResponse.json(
      { error: "Failed to initialize Stripe payment intent." },
      { status: 500 },
    );
  }

  const paymentIntentRecord = await prisma.paymentIntent.upsert({
    where: { orderId: order.id },
    update: {
      amount: totals.totalCents,
      currency,
      provider: PaymentProvider.STRIPE,
      status: PaymentIntentStatus.REQUIRES_ACTION,
      metadata: {
        stripePaymentIntentId: stripeIntent.id,
        contact: payload.contact,
        shipping: payload.shipping,
        billing: payload.billing,
      },
    },
    create: {
      orderId: order.id,
      amount: totals.totalCents,
      currency,
      provider: PaymentProvider.STRIPE,
      status: PaymentIntentStatus.REQUIRES_ACTION,
      metadata: {
        stripePaymentIntentId: stripeIntent.id,
        contact: payload.contact,
        shipping: payload.shipping,
        billing: payload.billing,
      },
    },
  });

  return NextResponse.json({
    orderId: order.id,
    paymentIntentId: paymentIntentRecord.id,
    clientSecret: stripeIntent.client_secret,
    amount: totals.totalCents,
    currency,
  });
}
