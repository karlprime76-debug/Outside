import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AVATARS_BUCKET } from "@/lib/supabase/storage";

export async function GET() {
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    return NextResponse.json(
      { error: "Cette route n'est accessible qu'en développement." },
      { status: 403 }
    );
  }

  const supabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  let bucketExists = false;
  let bucketError: string | null = null;

  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createSupabaseServerClient();
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        bucketError = error.message;
      } else {
        bucketExists = buckets.some((b) => b.name === AVATARS_BUCKET);
      }
    } catch (err) {
      bucketError = err instanceof Error ? err.message : "Erreur inconnue";
    }
  }

  return NextResponse.json({
    supabaseUrl,
    anonKey,
    serviceRoleKey,
    bucket: AVATARS_BUCKET,
    bucketExists,
    bucketError,
  });
}
