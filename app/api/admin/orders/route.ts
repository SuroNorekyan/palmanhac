import { NextResponse, type NextRequest } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import {
  requireAdminSession,
  TwoFactorRequiredError,
  UnauthorizedError,
} from "@/lib/auth/guards";
import { prisma } from "@/lib/server/db";

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

const statusEnum = z.nativeEnum(OrderStatus);
const paymentEnum = z.nativeEnum(PaymentStatus);

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? undefined;
    const paymentFilter = searchParams.get("paymentStatus") ?? undefined;

    const statusParsed = statusFilter ? statusEnum.safeParse(statusFilter) : null;
    const paymentParsed = paymentFilter ? paymentEnum.safeParse(paymentFilter) : null;

    const orders = await prisma.order.findMany({
      where: {
        ...(statusParsed?.success ? { status: statusParsed.data } : {}),
        ...(paymentParsed?.success ? { paymentStatus: paymentParsed.data } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                priceCents: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    return handleError(error, "Failed to load orders.");
  }
}
