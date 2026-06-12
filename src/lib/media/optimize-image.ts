import sharp from "sharp";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 82;
const WEBP_QUALITY = 80;

export async function optimizeImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; mimeType: string }> {
  if (!mimeType.startsWith("image/")) return { buffer, mimeType };

  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) return { buffer, mimeType };

  // Resize if exceeding max dimension (maintain aspect ratio)
  let pipeline = image;
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    pipeline = image.resize({
      width: Math.min(metadata.width, MAX_DIMENSION),
      height: Math.min(metadata.height, MAX_DIMENSION),
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to WebP for smaller size (unless it's a GIF or already WebP)
  const isGif = mimeType === "image/gif";
  const isWebp = mimeType === "image/webp";

  if (isGif) return { buffer, mimeType };

  const optimized = await pipeline
    .webp({ quality: isWebp ? WEBP_QUALITY : JPEG_QUALITY })
    .toBuffer();

  return { buffer: Buffer.from(optimized.buffer, optimized.byteOffset, optimized.byteLength), mimeType: isWebp ? mimeType : "image/webp" };
}