import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { hashPassword, passwordSchema } from "@/lib/security/password";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { prisma } from "@/lib/server/db";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  password: passwordSchema,
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, name, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const rate = consumeRateLimit(`auth:register:${normalizedEmail}`, 3, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
