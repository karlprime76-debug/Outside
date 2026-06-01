import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AVATARS_BUCKET,
  AVATAR_MAX_SIZE,
  ALLOWED_AVATAR_TYPES,
  buildAvatarPath,
} from "@/lib/supabase/storage";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch {
      return NextResponse.json(
        { error: "Le stockage d'images n'est pas configuré." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format d'image non accepté. Utilise JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size > AVATAR_MAX_SIZE) {
      return NextResponse.json(
        { error: "Cette image est trop lourde. Maximum 3 Mo." },
        { status: 400 }
      );
    }

    const path = buildAvatarPath(user.id, file.type);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[AVATAR UPLOAD] Supabase error:", uploadError);
      }

      if (uploadError.message?.includes("bucket") || uploadError.message?.includes("not found")) {
        return NextResponse.json(
          { error: "Le bucket avatars n'existe pas dans Supabase Storage." },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Impossible d'envoyer la photo. Réessaie." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
    const publicUrl = publicUrlData.publicUrl;

    await db.user.update({
      where: { id: user.id },
      data: { image: publicUrl },
    });

    return NextResponse.json({
      image: publicUrl,
      message: "Photo de profil mise à jour.",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[AVATAR UPLOAD] Unexpected error:", error);
    }
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
