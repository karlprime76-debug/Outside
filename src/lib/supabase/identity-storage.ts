export const IDENTITY_BUCKET = "identity-verifications";
export const IDENTITY_MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

export const ALLOWED_IDENTITY_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export function getIdentityFileExtension(fileType: string): string {
  switch (fileType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

export function buildIdentityPath(userId: string, fileType: string, kind: "document" | "selfie"): string {
  const ext = getIdentityFileExtension(fileType);
  const timestamp = Date.now();
  return `${userId}/${kind}-${timestamp}.${ext}`;
}

export function validateIdentityFile(file: File): { ok: boolean; error?: string } {
  if (!ALLOWED_IDENTITY_TYPES.includes(file.type)) {
    return { ok: false, error: "Format non accepté. Utilise JPG, PNG, WebP ou PDF." };
  }

  if (file.size > IDENTITY_MAX_SIZE) {
    return { ok: false, error: "Fichier trop lourd. Taille max : 5 Mo." };
  }

  return { ok: true };
}
