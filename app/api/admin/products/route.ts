import { NextResponse, type NextRequest } from "next/server";
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

const productSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes."),
  category: z.string().min(2),
  priceCents: z.number().int().min(0),
  image: z.string().url(),
  galleryImages: z.array(z.string().url()).optional(),
  volumeMl: z.number().int().min(0),
  abv: z.number().min(0).max(100),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  description: localeContentSchema,
  tastingNotes: localeContentSchema.partial(),
  details: z
    .object({
      region: localeContentSchema,
      base: localeContentSchema,
      type: localeContentSchema,
      bottleSize: localeContentSchema,
      servingTemperature: localeContentSchema,
      alcoholContent: localeContentSchema,
      awards: localeStringArraySchema,
    })
    .optional(),
});

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

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

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? undefined;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const products = await prisma.product.findMany({
      where: {
        ...(includeInactive ? {} : { isActive: true }),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { descriptionEn: { contains: query, mode: "insensitive" } },
                { descriptionPt: { contains: query, mode: "insensitive" } },
                { slug: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return handleError(error, "Failed to load products.");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = await request.json().catch(() => null);
    const parsed = productSchema
      .extend({ slug: productSchema.shape.slug.optional() })
      .safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload.", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const slug = data.slug ?? slugify(data.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists." },
        { status: 409 },
      );
    }

    const created = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        category: data.category,
        priceCents: data.priceCents,
        image: data.image,
        galleryImages: data.galleryImages ?? [data.image],
        volumeMl: data.volumeMl,
        abv: data.abv,
        stock: data.stock ?? 0,
        isActive: data.isActive ?? true,
        descriptionEn: data.description.en,
        descriptionPt: data.description.pt,
        tastingNotesEn: data.tastingNotes?.en,
        tastingNotesPt: data.tastingNotes?.pt,
        details: data.details ?? undefined,
      },
    });

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    return handleError(error, "Failed to create product.");
  }
}
