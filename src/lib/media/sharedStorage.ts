import fs from "fs/promises";
import path from "path";

const DEFAULT_SHARED_UPLOADS_DIR = "\\\\itskom\\Y\\Даулет\\images";

function resolveSharedUploadsDir() {
  const fromEnv = process.env.SHARED_UPLOADS_DIR?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_SHARED_UPLOADS_DIR;
}

export const SHARED_UPLOADS_DIR = resolveSharedUploadsDir();

type SavedFileInfo = {
  fileName: string;
  filePath: string;
  publicUrl: string;
};

function sanitizeExtension(ext: string) {
  const cleaned = ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return cleaned || "bin";
}

export function detectExtensionFromMime(mimeType: string, fallback = "bin") {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/heic") return "heic";
  if (mimeType === "audio/webm") return "webm";
  if (mimeType === "audio/mp4") return "m4a";
  if (mimeType === "audio/mpeg") return "mp3";
  if (mimeType === "video/mp4") return "mp4";
  if (mimeType === "video/webm") return "webm";
  return sanitizeExtension(fallback);
}

export async function saveFileToSharedFolder(params: {
  file: File;
  ownerId: string;
  prefix: string;
  routeBase: "/api/images" | "/api/media";
  explicitExt?: string;
}) : Promise<SavedFileInfo> {
  const { file, ownerId, prefix, routeBase, explicitExt } = params;
  const sourceExt = file.name.split(".").pop() || "";
  const ext = sanitizeExtension(explicitExt || sourceExt || detectExtensionFromMime(file.type, "bin"));
  const fileName = `${prefix}-${ownerId}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext}`;
  const filePath = path.join(SHARED_UPLOADS_DIR, fileName);

  await fs.mkdir(SHARED_UPLOADS_DIR, { recursive: true }).catch(() => undefined);
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

  return {
    fileName,
    filePath,
    publicUrl: `${routeBase}/${fileName}`,
  };
}

export async function removeSharedFileByPath(filePath: string) {
  await fs.unlink(filePath).catch(() => undefined);
}
