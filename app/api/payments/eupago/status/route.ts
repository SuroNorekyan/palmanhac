import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  EuPagoAPIError,
  EuPagoConfigurationError,
  getStatus,
} from "@/lib/payments/eupago";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transactionId");
  if (!transactionId) {
    return NextResponse.json({ error: "transactionId is required." }, { status: 400 });
  }

  try {
    const status = await getStatus(transactionId);
    return NextResponse.json({ status });
  } catch (error) {
    if (error instanceof EuPagoConfigurationError) {
      return NextResponse.json(
        { error: error.message, requiresConfiguration: true },
        { status: 500 },
      );
    }
    if (error instanceof EuPagoAPIError) {
      console.error("[EuPago] Status error:", error.message, error.response);
      return NextResponse.json(
        { error: "Unable to fetch payment status." },
        { status: 502 },
      );
    }
    console.error("[EuPago] Unexpected status error:", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
