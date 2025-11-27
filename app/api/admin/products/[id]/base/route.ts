import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  requireAdminSession,
  TwoFactorRequiredError,
  UnauthorizedError,
} from "@/lib/auth/guards";
import { prisma } from "@/lib/server/db";

const localeContentSchema = z.object({
  en: z.string().min(1, "English base is required"),
  pt: z.string().min(1, "Portuguese base is required"),
});

const baseSchema = z.object({
  base: localeContentSchema,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

const parseId = (value: string) => {
  const coerced = Number.parseInt(value, 10);
  return Number.isFinite(coerced) ? coerced : null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await context.params;
    const productId = parseId(id);
    if (!productId) {
      return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = baseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { details: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const nextDetails = (() => {
      if (!product.details || !isRecord(product.details)) {
        return { base: parsed.data.base } as Prisma.JsonObject;
      }
      return {
        ...product.details,
        base: parsed.data.base,
      } as Prisma.JsonObject;
    })();

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        baseEn: parsed.data.base.en,
        basePt: parsed.data.base.pt,
        details: nextDetails,
      },
      select: {
        id: true,
        name: true,
        baseEn: true,
        basePt: true,
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    return handleError(error, "Failed to update base.");
  }
}
