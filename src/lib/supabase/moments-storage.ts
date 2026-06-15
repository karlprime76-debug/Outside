export const MOMENTS_BUCKET = "moments";
export const MOMENT_PHOTO_MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
export const MOMENT_VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100 Mo

export const ALLOWED_MOMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/3gpp",
  "video/mpeg",
  "video/x-matroska",
];

// Formats clés pour l'attribut HTML accept (limité aux plus courants côté client)
export const ACCEPT_MEDIA_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/heic", "image/heif", "image/gif",
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/3gpp", "video/mpeg", "video/x-matroska",
].join(",");

export function getMomentFileExtension(fileType: string): string {
  switch (fileType) {
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/avif": return "avif";
    case "image/heic": return "heic";
    case "image/heif": return "heif";
    case "image/gif": return "gif";
    case "video/mp4": return "mp4";
    case "video/webm": return "webm";
    case "video/quicktime": return "mov";
    case "video/x-msvideo": return "avi";
    case "video/3gpp": return "3gp";
    case "video/mpeg": return "mpeg";
    case "video/x-matroska": return "mkv";
    case "image/jpeg":
    default: return "jpg";
  }
}

export function isVideo(fileType: string): boolean {
  return fileType.startsWith("video/");
}

export function buildMomentPath(userId: string, fileType: string): string {
  const ext = getMomentFileExtension(fileType);
  const timestamp = Date.now();
  const prefix = isVideo(fileType) ? "videos" : "photos";
  return `${prefix}/${userId}/${timestamp}.${ext}`;
}

export function validateMomentFile(file: File): { ok: boolean; error?: string } {
  if (!ALLOWED_MOMENT_TYPES.includes(file.type)) {
    return { ok: false, error: "Format non accepté." };
  }

  const maxSize = isVideo(file.type) ? MOMENT_VIDEO_MAX_SIZE : MOMENT_PHOTO_MAX_SIZE;
  if (file.size > maxSize) {
    const label = isVideo(file.type) ? "100 Mo" : "10 Mo";
    return { ok: false, error: `Fichier trop lourd. Taille max : ${label}.` };
  }

  return { ok: true };
}

export async function ensureMomentsBucket(supabase: unknown) {
  const client = supabase as {
    storage: {
      listBuckets: () => Promise<{ data: Array<{ name: string }> | null; error: { message: string } | null }>;
      createBucket: (_name: string, _opts: { public: boolean }) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) {
    throw new Error(`Impossible de lister les buckets: ${listError.message}`);
  }
  const exists = buckets?.some((b) => b.name === MOMENTS_BUCKET);
  if (!exists) {
    const { error: createError } = await client.storage.createBucket(MOMENTS_BUCKET, {
      public: true,
    });
    if (createError) {
      throw new Error(`Impossible de créer le bucket ${MOMENTS_BUCKET}: ${createError.message}`);
    }
  }
  return exists;
}
