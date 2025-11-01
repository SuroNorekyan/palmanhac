import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  encryptSecret,
  generateQRCodeDataUrl,
  generateTwoFASecret,
} from "@/lib/security/totp";
import { prisma } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  if (!user?.email) {
    return NextResponse.json({ error: "Admin email missing." }, { status: 400 });
  }

  const rate = consumeRateLimit(`admin:2fa:setup:${session.user.id}`, 5, 15 * 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many 2FA setup attempts. Please wait before retrying." },
      { status: 429 },
    );
  }

  try {
    const { secret, otpauth } = generateTwoFASecret(user.email);
    const encrypted = encryptSecret(secret);
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFASecret: encrypted,
        twoFAEnabled: false,
        recoveryCodes: [],
      },
    });

    const qrCode = await generateQRCodeDataUrl(otpauth);
    const manualEntry = secret.replace(/(.{4})/g, "$1 ").trim();

    return NextResponse.json({
      qrCode,
      otpauth,
      manualEntry,
    });
  } catch (error) {
    console.error("Failed to generate 2FA secret", error);
    return NextResponse.json(
      { error: "Failed to prepare 2FA setup. Please contact support." },
      { status: 500 },
    );
  }
}
