import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DM_MEDIA_BUCKET,
  ALLOWED_DM_IMAGE_TYPES,
  ALLOWED_DM_VIDEO_TYPES,
  ALLOWED_DM_AUDIO_TYPES,
  buildDmMediaPath,
  extFromMime,
  ensureDmBucket,
} from "@/lib/supabase/dm-storage";

const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_AUDIO = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const conversationId = (formData.get("conversationId") as string) || "";

    if (!file || !conversationId) {
      return NextResponse.json({ error: "Fichier ou conversation manquant." }, { status: 400 });
    }

    // Validate access
    const part = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: user.id },
    });
    if (!part) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const fileType = file.type;
    const isImage = (ALLOWED_DM_IMAGE_TYPES as readonly string[]).includes(fileType);
    const isVideo = (ALLOWED_DM_VIDEO_TYPES as readonly string[]).includes(fileType);
    const isAudio = (ALLOWED_DM_AUDIO_TYPES as readonly string[]).includes(fileType);
    if (!isImage && !isVideo && !isAudio) {
      return NextResponse.json({ error: "Format non accepté." }, { status: 400 });
    }

    const limit = isImage ? MAX_IMAGE : isVideo ? MAX_VIDEO : MAX_AUDIO;
    if (file.size > limit) {
      return NextResponse.json(
        { error: `Fichier trop lourd. Max ${limit / (1024 * 1024)} Mo.` },
        { status: 413 }
      );
    }

    let type: string;
    if (isImage) type = "IMAGE";
    else if (isVideo) type = "VIDEO";
    else type = "AUDIO";

    const supabase = createSupabaseServerClient();
    await ensureDmBucket(supabase);

    const ext = extFromMime(file.type);
    const path = buildDmMediaPath(conversationId, user.id, ext);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(DM_MEDIA_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error("[DM_UPLOAD] error:", uploadError.message);
      return NextResponse.json({ error: "Échec de l'upload." }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(DM_MEDIA_BUCKET).getPublicUrl(path);
    const mediaUrl = urlData.publicUrl;

    return NextResponse.json({
      mediaUrl,
      type,
      path,
      mediaName: file.name,
      mediaMimeType: file.type,
      mediaSize: file.size,
      code: "SUCCESS",
    });
  } catch (err) {
    console.error("[DM_UPLOAD] unexpected:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
