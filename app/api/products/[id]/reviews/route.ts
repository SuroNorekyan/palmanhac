import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/server/db";

const createSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000),
  guestName: z.string().trim().min(1).max(120).optional(),
  guestEmail: z.string().trim().email().optional(),
});

const parseProductId = (raw: string) => {
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

type ReviewWithUser = Prisma.ProductReviewGetPayload<{
  include: { user: { select: { name: true } } };
}>;

const mapReview = (review: ReviewWithUser | null) => {
  if (!review) {
    return null;
  }
  const authorName =
    review.user?.name?.trim() ||
    review.guestName?.trim() ||
    review.guestEmail?.trim() ||
    "Guest";

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    authorName,
    createdAt: review.createdAt.toISOString(),
  };
};

const buildRateKey = (request: NextRequest, productId: number, userId: string | null) => {
  if (userId) {
    return `reviews:user:${userId}:${productId}`;
  }
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";
  return `reviews:ip:${ip}:${productId}`;
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const productId = parseProductId(id);
  if (!productId) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get("limit") ?? "10", 10);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 10;

  const [summary, reviews] = await Promise.all([
    prisma.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true },
    }),
    prisma.productReview.findMany({
      where: { productId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
    }),
  ]);

  const mappedReviews = reviews
    .map((review) => mapReview(review))
    .filter((review): review is NonNullable<ReturnType<typeof mapReview>> =>
      Boolean(review),
    );

  return NextResponse.json({
    summary: {
      average: Number(summary._avg.rating ?? 0),
      count: summary._count.id,
    },
    reviews: mappedReviews,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await context.params;
  const productId = parseProductId(id);
  if (!productId) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const productExists = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!productExists) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const rateKey = buildRateKey(request, productId, session?.user?.id ?? null);
  const rate = consumeRateLimit(rateKey, 3, 5 * 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many reviews. Please try again later." },
      { status: 429 },
    );
  }

  const payload = parsed.data;
  const created = await prisma.productReview.create({
    data: {
      productId,
      userId: session?.user?.id ?? undefined,
      guestName: session?.user ? undefined : payload.guestName?.trim(),
      guestEmail: session?.user ? undefined : payload.guestEmail?.trim(),
      rating: payload.rating,
      comment: payload.comment.trim(),
    },
    include: { user: { select: { name: true } } },
  });
  const mappedReview = mapReview(created);
  if (!mappedReview) {
    return NextResponse.json(
      { error: "Failed to prepare review response." },
      { status: 500 },
    );
  }

  const summary = await prisma.productReview.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true },
  });

  return NextResponse.json(
    {
      review: mappedReview,
      summary: {
        average: Number(summary._avg.rating ?? 0),
        count: summary._count.id,
      },
    },
    { status: 201 },
  );
}
