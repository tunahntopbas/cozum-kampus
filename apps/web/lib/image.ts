const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export function isSupportedImageType(type: string): boolean {
  return SUPPORTED_TYPES.includes(type);
}

export function fitWithin(w: number, h: number, max = MAX_EDGE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

// Re-encoding through a canvas drops all EXIF metadata (GPS, device info) before upload.
export async function prepareImage(file: File): Promise<Blob> {
  if (!isSupportedImageType(file.type)) throw new Error("Bu dosya türü desteklenmiyor");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Fotoğraf işlenemedi");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Fotoğraf işlenemedi"))), "image/jpeg", JPEG_QUALITY),
  );
}
