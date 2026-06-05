import { createSupabaseServerClient } from "./server";

export const AUDIO_BUCKET = "moment-audio";

export async function ensureAudioBucket() {
  const supabase = createSupabaseServerClient();
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(error.message);
  const exists = buckets?.some((b) => b.name === AUDIO_BUCKET);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(AUDIO_BUCKET, {
      public: true,
    });
    if (createError) throw new Error(createError.message);
  }
}
