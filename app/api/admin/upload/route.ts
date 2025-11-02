import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const assetsDir = path.join(process.cwd(), "public", "assets");
    await mkdir(assetsDir, { recursive: true });

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const dest = path.join(assetsDir, filename);
    await writeFile(dest, buffer);

    return NextResponse.json({ path: `/assets/${filename}` });
  } catch (e) {
    console.error("[upload] error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
