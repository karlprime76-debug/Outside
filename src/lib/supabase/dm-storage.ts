export const DM_MEDIA_BUCKET = "dm-media";

export const ALLOWED_DM_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_DM_VIDEO_TYPES = ["video/mp4", "video/webm"] as const;
export const ALLOWED_DM_AUDIO_TYPES = ["audio/webm", "audio/m4a", "audio/mp3", "audio/mpeg"] as const;

export function buildDmMediaPath(conversationId: string, userId: string, ext: string) {
  const ts = Date.now();
  return `conversations/${conversationId}/${userId}/${ts}.${ext}`;
}

export function extFromMime(mime: string): string {
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("m4a")) return "m4a";
  if (mime.includes("mp3") || mime.includes("mpeg")) return "mp3";
  return "bin";
}

export async function ensureDmBucket(supabase: unknown) {
  const client = supabase as {
    storage: {
      listBuckets: () => Promise<{ data: Array<{ name: string }> | null; error: { message: string } | null }>;
      createBucket: (name: string, opts: { public: boolean }) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw new Error(error.message);
  const exists = buckets?.some((b) => b.name === DM_MEDIA_BUCKET);
  if (!exists) {
    const { error: createError } = await client.storage.createBucket(DM_MEDIA_BUCKET, { public: true });
    if (createError) throw new Error(createError.message);
  }
}
