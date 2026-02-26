import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { SHARED_UPLOADS_DIR } from "@/lib/media/sharedStorage";

export const runtime = "nodejs";

function resolveMimeType(ext: string) {
  const normalized = ext.toLowerCase();
  if (normalized === ".jpg" || normalized === ".jpeg") return "image/jpeg";
  if (normalized === ".png") return "image/png";
  if (normalized === ".webp") return "image/webp";
  if (normalized === ".gif") return "image/gif";
  if (normalized === ".heic") return "image/heic";
  if (normalized === ".m4a") return "audio/mp4";
  if (normalized === ".mp3") return "audio/mpeg";
  if (normalized === ".wav") return "audio/wav";
  if (normalized === ".oga" || normalized === ".ogg") return "audio/ogg";
  if (normalized === ".webm") return "video/webm";
  if (normalized === ".mp4") return "video/mp4";
  return "application/octet-stream";
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const safeName = filename.replace(/[\\/]/g, "");
    const filePath = path.join(SHARED_UPLOADS_DIR, safeName);
    const data = await fs.readFile(filePath);
    const ext = path.extname(safeName);
    return new NextResponse(data, {
      headers: {
        "Content-Type": resolveMimeType(ext),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
