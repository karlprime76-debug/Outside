import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChallengeType } from "@prisma/client";
import { GamificationEngine } from "@/lib/gamification-engine";
import {
  CHECKIN_BUCKET,
  CHECKIN_MAX_SIZE,
  ALLOWED_CHECKIN_TYPES,
  buildCheckinPath,
  ensureCheckinBucket,
} from "@/lib/supabase/checkin-storage";
import { evaluateCheckinBadge } from "@/lib/badges";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const participant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
      include: { plan: { select: { startDate: true } } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Tu n'es pas participant" }, { status: 403 });
    }

    if (participant.checkedInAt) {
      return NextResponse.json({ error: "Tu es déjà check-in" }, { status: 400 });
    }

    const planStart = new Date(participant.plan.startDate).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (now < planStart - oneHour || now > planStart + oneHour) {
      return NextResponse.json({ error: "Check-in autorisé seulement 1h autour du début du plan" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucune image reçue" }, { status: 400 });
    }

    if (!ALLOWED_CHECKIN_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format non accepté. Utilise JPG, PNG ou WebP." }, { status: 400 });
    }

    if (file.size > CHECKIN_MAX_SIZE) {
      return NextResponse.json({ error: "Image trop lourde. Taille max : 10 Mo." }, { status: 400 });
    }

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch {
      return NextResponse.json({ error: "Supabase Storage non configuré." }, { status: 500 });
    }

    await ensureCheckinBucket(supabase);

    const filePath = buildCheckinPath(user.id, id, file.type);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(CHECKIN_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[CHECKIN]", "Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Impossible d'envoyer l'image." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(CHECKIN_BUCKET).getPublicUrl(filePath);
    const checkinPhotoUrl = publicUrlData.publicUrl;

    const updated = await db.planParticipant.update({
      where: { planId_userId: { planId: id, userId: user.id } },
      data: { checkedInAt: new Date(), checkinPhotoUrl },
    });

    evaluateCheckinBadge(user.id).catch((err: unknown) => {
      console.error("[CHECKIN]", "Badge error:", err);
    });

    GamificationEngine.trackAction(user.id, ChallengeType.CHECK_IN).catch((err) => {
      console.error("[GAMIFICATION_ERROR]", err);
    });

    return NextResponse.json({
      checkedInAt: updated.checkedInAt,
      checkinPhotoUrl: updated.checkinPhotoUrl,
    });
  } catch (error) {
    console.error("[CHECKIN]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
