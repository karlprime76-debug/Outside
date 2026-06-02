import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AVATARS_BUCKET } from "@/lib/supabase/storage";
import { MOMENTS_BUCKET } from "@/lib/supabase/moments-storage";

export async function GET() {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    return NextResponse.json(
      { error: "Cette route n'est accessible qu'en développement." },
      { status: 403 }
    );
  }

  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  let avatarsBucketExists = false;
  let momentsBucketExists = false;
  let bucketError: string | null = null;

  if (hasSupabaseUrl && hasServiceRoleKey) {
    try {
      const supabase = createSupabaseServerClient();
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        bucketError = error.message;
      } else {
        avatarsBucketExists = buckets.some((b) => b.name === AVATARS_BUCKET);
        momentsBucketExists = buckets.some((b) => b.name === MOMENTS_BUCKET);
      }
    } catch (err) {
      bucketError = err instanceof Error ? err.message : "Erreur inconnue";
    }
  }

  return NextResponse.json({
    env: {
      hasSupabaseUrl,
      hasServiceRoleKey,
    },
    storage: {
      avatarsBucketExists,
      momentsBucketExists,
      bucketError,
    },
  });
}
