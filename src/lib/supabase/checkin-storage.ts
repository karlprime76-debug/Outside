export const CHECKIN_BUCKET = "checkins";
export const CHECKIN_MAX_SIZE = 10 * 1024 * 1024;

export const ALLOWED_CHECKIN_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function getCheckinFileExtension(fileType: string): string {
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

export function buildCheckinPath(userId: string, planId: string, fileType: string): string {
  const ext = getCheckinFileExtension(fileType);
  const timestamp = Date.now();
  return `${userId}/${planId}/${timestamp}.${ext}`;
}

export async function ensureCheckinBucket(supabase: unknown) {
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
  const exists = buckets?.some((b) => b.name === CHECKIN_BUCKET);
  if (!exists) {
    const { error: createError } = await client.storage.createBucket(CHECKIN_BUCKET, {
      public: true,
    });
    if (createError) {
      throw new Error(`Impossible de créer le bucket ${CHECKIN_BUCKET}: ${createError.message}`);
    }
  }
  return exists;
}
