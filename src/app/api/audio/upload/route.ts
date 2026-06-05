import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAudioBucket, AUDIO_BUCKET } from "@/lib/supabase/audio-storage";
import { isValidAudioType, MAX_AUDIO_SIZE, getAudioExtension, buildAudioPath, AUDIO_RIGHTS_NOTICE } from "@/lib/audio";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null)?.trim();
    const artistName = (formData.get("artistName") as string | null)?.trim() || null;
    const isOriginal = formData.get("isOriginal") === "true";
    const rightsConfirmed = formData.get("rightsConfirmed") === "true";

    if (!rightsConfirmed) {
      return NextResponse.json({ error: "Tu dois confirmer avoir les droits ou l'autorisation d'utiliser ce son." }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier audio reçu." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Le titre du son est requis." }, { status: 400 });
    }
    if (!isValidAudioType(file.type)) {
      return NextResponse.json({ error: "Format audio non accepté. Utilise MP3, WAV, WebM, AAC ou OGG." }, { status: 400 });
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: "Fichier audio max 10 Mo." }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    await ensureAudioBucket();

    const ext = getAudioExtension(file.type);
    const path = buildAudioPath(user.id, ext);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Audio upload error:", uploadError);
      return NextResponse.json({ error: "Impossible d'envoyer le fichier audio." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);
    const audioUrl = publicUrlData.publicUrl;

    const track = await db.audioTrack.create({
      data: {
        ownerId: user.id,
        title,
        artistName,
        sourceType: isOriginal ? "MOMENT_ORIGINAL" : "USER_ORIGINAL",
        status: "ACTIVE",
        audioUrl,
        audioPath: path,
        isOriginal,
        rightsConfirmed: true,
      },
    });

    return NextResponse.json({ track, notice: AUDIO_RIGHTS_NOTICE }, { status: 201 });
  } catch (error) {
    console.error("Audio upload error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
