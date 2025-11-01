import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { extractSessionToken } from "@/lib/auth/utils";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  decryptSecret,
  matchRecoveryCodeIndex,
  verifyTotpToken,
} from "@/lib/security/totp";
import { prisma } from "@/lib/server/db";

const challengeSchema = z
  .object({
    token: z
      .string()
      .optional()
      .transform((value) => value?.replace(/\s+/g, "")),
    recoveryCode: z.string().optional(),
  })
  .refine((value) => value.token || value.recoveryCode, {
    message: "Provide a TOTP code or a recovery code.",
  });

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = challengeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const rate = consumeRateLimit(
    `admin:2fa:challenge:${session.user.id}`,
    10,
    10 * 60_000,
  );
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

  if (!user?.twoFASecret || !user.recoveryCodes) {
    return NextResponse.json({ error: "2FA is not configured." }, { status: 400 });
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

  const { token, recoveryCode } = parsed.data;
  let verified = false;
  let updatedRecoveryCodes = user.recoveryCodes;

  if (recoveryCode) {
    const index = await matchRecoveryCodeIndex(recoveryCode.trim(), user.recoveryCodes);
    if (index >= 0) {
      verified = true;
      updatedRecoveryCodes = user.recoveryCodes.filter((_, idx) => idx !== index);
    }
  } else if (token) {
    verified = verifyTotpToken(token, secret);
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid authentication code." }, { status: 401 });
  }

  const sessionToken = extractSessionToken(request);

  await prisma.$transaction(async (tx) => {
    if (recoveryCode) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { recoveryCodes: updatedRecoveryCodes },
      });
    }
    if (sessionToken) {
      await tx.session.updateMany({
        where: { sessionToken },
        data: { lastTwoFAVerified: new Date() },
      });
    }
  });

  return NextResponse.json({ success: true });
}
