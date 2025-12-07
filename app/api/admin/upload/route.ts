import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = file.name || "upload";
    const safeName = originalName.replace(/[^\w.\-]+/g, "_");
    const filename = `${Date.now()}-${safeName}`;

    // Upload the File directly
    const blob = await put(`products/${filename}`, file, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ path: blob.url }, { status: 200 });
  } catch (err) {
    console.error("[Vercel Blob] Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
