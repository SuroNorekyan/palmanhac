import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { extractSessionToken } from "@/lib/auth/utils";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  decryptSecret,
  generateRecoveryCodes,
  verifyTotpToken,
} from "@/lib/security/totp";
import { prisma } from "@/lib/server/db";

const verifySchema = z.object({
  token: z
    .string()
    .min(6)
    .max(10)
    .transform((value) => value.replace(/\s+/g, "")),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid verification payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { token } = parsed.data;
  const rate = consumeRateLimit(`admin:2fa:verify:${session.user.id}`, 5, 5 * 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFASecret: true, recoveryCodes: true },
  });

  if (!user?.twoFASecret) {
    return NextResponse.json({ error: "2FA secret not initialized." }, { status: 400 });
  }

  let secret: string;
  try {
    secret = decryptSecret(user.twoFASecret);
  } catch (error) {
    console.error("Failed to decrypt 2FA secret", error);
    return NextResponse.json(
      { error: "Unable to validate code. Please contact support." },
      { status: 500 },
    );
  }

  const isValid = verifyTotpToken(token, secret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid authentication code." }, { status: 400 });
  }

  const { codes, hashes } = await generateRecoveryCodes();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        twoFAEnabled: true,
        twoFASecret: user.twoFASecret,
        recoveryCodes: hashes,
      },
    });

    const sessionToken = extractSessionToken(request);
    if (sessionToken) {
      await tx.session.updateMany({
        where: { sessionToken },
        data: { lastTwoFAVerified: new Date() },
      });
    }
  });

  return NextResponse.json({
    success: true,
    recoveryCodes: codes,
  });
}
