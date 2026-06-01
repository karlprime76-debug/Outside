import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

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

    if (!supabaseServer) {
      return NextResponse.json(
        { error: "Le stockage d'images n'est pas configuré." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non accepté. Utilise JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Ce fichier est trop lourd. Maximum 5 Mo." },
        { status: 400 }
      );
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `avatars/${user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[AVATAR UPLOAD] Supabase error:", uploadError);
      }
      return NextResponse.json(
        { error: "Impossible d'envoyer la photo. Réessaie." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseServer.storage.from("avatars").getPublicUrl(path);
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
