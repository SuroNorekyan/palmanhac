import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: Implement Multibanco signature verification and event handling
  await request.text();
  return NextResponse.json(
    { received: true, message: "Multibanco webhook handling not yet implemented." },
    { status: 202 },
  );
}
