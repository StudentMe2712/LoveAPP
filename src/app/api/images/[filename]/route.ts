import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { SHARED_UPLOADS_DIR } from "@/lib/media/sharedStorage";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const safeName = filename.replace(/[\\/]/g, "");
    const filePath = path.join(SHARED_UPLOADS_DIR, safeName);

    const data = await fs.readFile(filePath);
    const ext = path.extname(safeName).toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    if (ext === ".webp") mimeType = "image/webp";
    if (ext === ".gif") mimeType = "image/gif";
    if (ext === ".svg") mimeType = "image/svg+xml";
    if (ext === ".heic") mimeType = "image/heic";

    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
