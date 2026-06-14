import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildMomentPath, MOMENTS_BUCKET } from "@/lib/supabase/moments-storage";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { fileType } = await req.json();
    if (!fileType || typeof fileType !== "string") {
      return NextResponse.json({ error: "Type de fichier requis." }, { status: 400 });
    }

    const allowed = [
      "image/jpeg", "image/png", "image/webp",
      "video/mp4", "video/webm", "video/quicktime",
    ];
    if (!allowed.includes(fileType)) {
      return NextResponse.json({ error: "Format non accepté." }, { status: 400 });
    }

    const momentLimit = await rateLimit(`moment:${user.id}`, 20, 3600000);
    if (!momentLimit.success) {
      return NextResponse.json(
        { error: "Trop de moments publiés. Réessaie plus tard." },
        { status: 429, headers: getRateLimitHeaders(momentLimit) }
      );
    }

    const supabase = createSupabaseServerClient();
    const filePath = buildMomentPath(user.id, fileType);

    const { data, error } = await supabase.storage
      .from(MOMENTS_BUCKET)
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      console.error("[INIT_UPLOAD] Signed URL error:", error);
      return NextResponse.json({ error: "Impossible d'initialiser l'upload." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(MOMENTS_BUCKET).getPublicUrl(filePath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      filePath: data.path,
      token: data.token,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("[INIT_UPLOAD]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
