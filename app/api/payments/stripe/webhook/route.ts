import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: Implement Stripe signature verification and event handling
  await request.text(); // consume body
  return NextResponse.json(
    { received: true, message: "Stripe webhook handling not yet implemented." },
    { status: 202 },
  );
}
