import { NextResponse, type NextRequest } from "next/server";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import {
  requireAdminSession,
  TwoFactorRequiredError,
  UnauthorizedError,
} from "@/lib/auth/guards";
import { prisma } from "@/lib/server/db";

const updateSchema = z
  .object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    notes: z.string().max(500).optional(),
  })
  .strict();

const handleError = (error: unknown, fallback = "Unexpected error.") => {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }
  if (error instanceof TwoFactorRequiredError) {
    return NextResponse.json(
      { error: "Two-factor authentication is required." },
      { status: 401 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true, priceCents: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    return handleError(error, "Failed to load order.");
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.paymentStatus
          ? { paymentStatus: parsed.data.paymentStatus }
          : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, image: true, priceCents: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return handleError(error, "Failed to update order.");
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return handleError(error, "Failed to delete order.");
  }
}
