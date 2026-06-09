export const AVATARS_BUCKET = "avatars";
export const AVATAR_MAX_SIZE = 5 * 1024 * 1024;

export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function getAvatarFileExtension(fileType: string): string {
  switch (fileType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

export function buildAvatarPath(userId: string, fileType: string): string {
  const ext = getAvatarFileExtension(fileType);
  const timestamp = Date.now();
  return `users/${userId}/avatar-${timestamp}.${ext}`;
}

export async function ensureAvatarsBucket(supabase: unknown) {
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
  const exists = buckets?.some((b) => b.name === AVATARS_BUCKET);
  if (!exists) {
    const { error: createError } = await client.storage.createBucket(AVATARS_BUCKET, {
      public: true,
    });
    if (createError) {
      throw new Error(`Impossible de créer le bucket ${AVATARS_BUCKET}: ${createError.message}`);
    }
  }
  return exists;
}
