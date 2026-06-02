export const MOMENTS_BUCKET = "moments";
export const MOMENT_PHOTO_MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
export const MOMENT_VIDEO_MAX_SIZE = 50 * 1024 * 1024; // 50 Mo

export const ALLOWED_MOMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

export function getMomentFileExtension(fileType: string): string {
  switch (fileType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    case "image/jpeg":
    default:
      return "jpg";
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
    return { ok: false, error: "Format non accepté. Utilise JPG, PNG, WebP, MP4 ou WebM." };
  }

  const maxSize = isVideo(file.type) ? MOMENT_VIDEO_MAX_SIZE : MOMENT_PHOTO_MAX_SIZE;
  if (file.size > maxSize) {
    const label = isVideo(file.type) ? "50 Mo" : "5 Mo";
    return { ok: false, error: `Fichier trop lourd. Taille max : ${label}.` };
  }

  return { ok: true };
}

export async function ensureMomentsBucket(supabase: unknown) {
  const client = supabase as {
    storage: {
      listBuckets: () => Promise<{ data: Array<{ name: string }> | null; error: { message: string } | null }>;
      createBucket: (name: string, opts: { public: boolean }) => Promise<{ error: { message: string } | null }>;
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
