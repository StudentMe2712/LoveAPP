const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 900 * 1024;
const MAX_EDGE = 1440;
const START_QUALITY = 0.82;
const MIN_QUALITY = 0.45;
const QUALITY_STEP = 0.07;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Не удалось подготовить изображение"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Файл не похож на корректное изображение"));
    };
    image.src = objectUrl;
  });
}

export function assertBackgroundUpload(file: File): void {
  if (!file.type.startsWith("image/")) {
    throw new Error("Можно загружать только изображения");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Слишком большой файл (максимум 10MB)");
  }
}

export async function compressBackgroundToWebp(file: File): Promise<Blob> {
  assertBackgroundUpload(file);

  const image = await loadImage(file);
  const longestEdge = Math.max(image.width, image.height);
  const scale = longestEdge > MAX_EDGE ? MAX_EDGE / longestEdge : 1;

  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Не удалось обработать изображение");
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = START_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > MAX_OUTPUT_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new Error("Файл слишком тяжёлый после сжатия (лимит 900KB)");
  }

  return blob;
}
