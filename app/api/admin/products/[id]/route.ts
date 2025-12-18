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
  en: z.string().default(""),
  pt: z.string().default(""),
});

const localeStringArraySchema = z.object({
  en: z.array(z.string()).default([]),
  pt: z.array(z.string()).default([]),
});

const imageUrlOrPathSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) return false;
      if (/^\/(assets|images)\//i.test(value)) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Provide an absolute URL or a path like /assets/file.png" },
  );

const detailsSchema = z.object({
  region: localeContentSchema,
  base: localeContentSchema,
  type: localeContentSchema,
  bottleSize: localeContentSchema,
  servingTemperature: localeContentSchema,
  alcoholContent: localeContentSchema,
  awards: localeStringArraySchema,
});

const updateSchema = z
  .object({
    name: z.string().min(2).optional(),
    namePt: z.string().min(2).optional(),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes.")
      .optional(),
    category: z.string().min(2).optional(),
    priceCents: z.number().int().min(0).optional(),
    image: imageUrlOrPathSchema.optional(),
    galleryImages: z.array(imageUrlOrPathSchema).optional(),
    volumeMl: z.number().int().min(0).optional(),
    vol: z.number().min(0).max(100).optional(),
    stock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    description: localeContentSchema.optional(),
    tastingNotes: localeContentSchema.partial().optional(),
    base: localeContentSchema.optional(),
    details: detailsSchema.optional(),
    discountEnabled: z.boolean().optional(),
    discountPercent: z.number().int().min(0).max(99).optional(),
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

const parseId = (value: string) => {
  const coerced = Number.parseInt(value, 10);
  return Number.isFinite(coerced) ? coerced : null;
};

export async function GET(
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

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return handleError(error, "Failed to load product.");
  }
}

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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updates = parsed.data;

    if (updates.slug) {
      const slugOwner = await prisma.product.findUnique({
        where: { slug: updates.slug },
      });
      if (slugOwner && slugOwner.id !== productId) {
        return NextResponse.json(
          { error: "Another product already uses this slug." },
          { status: 409 },
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.namePt ? { namePt: updates.namePt } : {}),
        ...(updates.slug ? { slug: updates.slug } : {}),
        ...(updates.category ? { category: updates.category } : {}),
        ...(updates.priceCents !== undefined ? { priceCents: updates.priceCents } : {}),
        ...(updates.image ? { image: updates.image } : {}),
        ...(updates.galleryImages ? { galleryImages: updates.galleryImages } : {}),
        ...(updates.volumeMl !== undefined ? { volumeMl: updates.volumeMl } : {}),
        ...(updates.vol !== undefined ? { vol: updates.vol } : {}),
        ...(updates.stock !== undefined ? { stock: updates.stock } : {}),
        ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
        ...(updates.discountEnabled !== undefined
          ? { discountEnabled: updates.discountEnabled }
          : {}),
        ...(updates.discountPercent !== undefined
          ? { discountPercent: updates.discountPercent }
          : {}),
        ...(updates.description
          ? {
              descriptionEn: updates.description.en,
              descriptionPt: updates.description.pt,
            }
          : {}),
        ...(updates.tastingNotes
          ? {
              tastingNotesEn: updates.tastingNotes.en,
              tastingNotesPt: updates.tastingNotes.pt,
            }
          : {}),
        ...(updates.base
          ? {
              baseEn: updates.base.en,
              basePt: updates.base.pt,
            }
          : {}),
        ...(updates.details
          ? {
              details: updates.base
                ? { ...updates.details, base: updates.base }
                : updates.details,
            }
          : {}),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    return handleError(error, "Failed to update product.");
  }
}

export async function DELETE(
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

    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof TwoFactorRequiredError) {
      return handleError(error, "Failed to delete product.");
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Product cannot be removed because it is linked to existing orders." },
        { status: 409 },
      );
    }
    return handleError(error, "Failed to delete product.");
  }
}
