import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json({ error: "Format non accepté. Utilise JPG, PNG ou WebP." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Cette image est trop lourde. Maximum 10 Mo." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `covers/${user.id}_${Date.now()}.${ext}`;

    const supabase = createSupabaseServerClient();
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: "Impossible d'envoyer l'image.", code: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const coverUrl = urlData?.publicUrl || "";

    await db.user.update({ where: { id: user.id }, data: { coverImage: coverUrl } });

    return NextResponse.json({ coverImage: coverUrl, message: "Photo de couverture mise à jour." });
  } catch {
    return NextResponse.json({ error: "Impossible d'envoyer la photo de couverture." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    await db.user.update({
      where: { email: session.user.email },
      data: { coverImage: null },
    });

    return NextResponse.json({ message: "Photo de couverture supprimée." });
  } catch {
    return NextResponse.json({ error: "Impossible de supprimer la photo." }, { status: 500 });
  }
}
