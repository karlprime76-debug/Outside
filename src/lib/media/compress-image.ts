export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: "webp" | "jpeg";
  logStats?: boolean;
}

export interface CompressResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputFormat = "webp",
    logStats = process.env.NODE_ENV === "development",
  } = options;

  // Don't compress non-image files
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier n'est pas une image.");
  }

  // Don't compress gifs (preserve animation)
  if (file.type === "image/gif") {
    if (logStats) {
      console.log("[CompressImage] GIF non compressé (préservation animation)");
    }
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  // Don't compress if already small enough
  if (file.size < 100 * 1024) { // Less than 100KB
    if (logStats) {
      console.log("[CompressImage] Fichier déjà petit (<100KB), pas de compression");
    }
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas for compression
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Impossible de créer le contexte canvas"));
        return;
      }

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output MIME type
      const mimeType = outputFormat === "webp" ? "image/webp" : "image/jpeg";

      // Compress
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Échec de la compression"));
            return;
          }

          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, `.${outputFormat === "webp" ? "webp" : "jpg"}`), {
            type: mimeType,
          });

          const originalSize = file.size;
          const compressedSize = compressedFile.size;
          const compressionRatio = compressedSize / originalSize;

          if (logStats) {
            console.log("[CompressImage] Compression réussie:");
            console.log(`  Original: ${(originalSize / 1024).toFixed(2)} KB`);
            console.log(`  Compressé: ${(compressedSize / 1024).toFixed(2)} KB`);
            console.log(`  Ratio: ${(compressionRatio * 100).toFixed(1)}%`);
            console.log(`  Dimensions: ${width}x${height}`);
          }

          resolve({
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Erreur lors du chargement de l'image"));
    };

    img.src = url;
  });
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

export function shouldCompressImage(file: File): boolean {
  return isImageFile(file) && file.type !== "image/gif" && file.size > 100 * 1024;
}
