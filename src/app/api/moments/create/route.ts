import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";
import { recordTripHistory } from "@/lib/passport";
import { MOMENTS_BUCKET } from "@/lib/supabase/moments-storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MomentVisibility, ChallengeType } from "@prisma/client";
import { GamificationEngine } from "@/lib/gamification-engine";
import { cacheClear } from "@/lib/cache";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const {
      filePath,
      publicUrl,
      fileType,
      caption,
      visibility,
      city,
      countryCode,
      planId,
      placeId,
      eventId,
      liveId,
      mediaWidth,
      mediaHeight,
      mediaDuration,
      mediaCrop,
      videoStartTime,
      videoEndTime,
      mediaAspectRatio,
      audioTrackId,
      audioStartTime,
      audioVolume,
    } = body;

    if (!filePath || !publicUrl || !fileType) {
      return NextResponse.json({ error: "Informations du fichier manquantes." }, { status: 400 });
    }

    // Validate the upload exists in Supabase
    const supabase = createSupabaseServerClient();
    const { data: exists } = await supabase.storage
      .from(MOMENTS_BUCKET)
      .list(filePath.substring(0, filePath.lastIndexOf("/")));

    const fileName = filePath.split("/").pop();
    const fileFound = exists?.some((f) => f.name === fileName);
    if (!fileFound) {
      return NextResponse.json({ error: "Fichier introuvable." }, { status: 400 });
    }

    // Validate metadata
    const parsedMediaCrop = mediaCrop ? (() => {
      try { return JSON.parse(mediaCrop); } catch { return null; }
    })() : null;

    const expiresIn = body.expiresIn as string | null;
    let expiresAt: Date | undefined;
    if (expiresIn) {
      const match = expiresIn.match(/^(\d+)([hd])$/);
      if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const ms = unit === "h" ? value * 3_600_000 : value * 86_400_000;
        expiresAt = new Date(Date.now() + ms);
      }
    }

    if (!city && !planId && !placeId && !eventId && !liveId) {
      return NextResponse.json(
        { error: "Un moment doit être lié à une sortie, un lieu ou une ville." },
        { status: 400 }
      );
    }

    if (planId) {
      const canView = await canViewPlan(user.id, planId);
      if (!canView) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    const momentType = fileType.startsWith("video/") ? "VIDEO" : "PHOTO";
    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        type: momentType,
        mediaUrl: publicUrl,
        caption: caption?.trim() || null,
        expiresAt,
        visibility: (visibility ?? "PUBLIC") as MomentVisibility,
        city: city || null,
        countryCode: countryCode || null,
        planId: planId || null,
        placeId: placeId || null,
        eventId: eventId || null,
        liveId: liveId || null,
        audioTrackId: audioTrackId || null,
        audioStartTime: audioStartTime ? parseInt(audioStartTime, 10) : 0,
        audioVolume: audioVolume ? Math.min(1, Math.max(0, parseFloat(audioVolume))) : 1,
        mediaWidth: mediaWidth ? parseInt(mediaWidth, 10) : null,
        mediaHeight: mediaHeight ? parseInt(mediaHeight, 10) : null,
        mediaDuration: mediaDuration ? parseInt(mediaDuration, 10) : null,
        mediaCrop: parsedMediaCrop,
        videoStartTime: videoStartTime ? parseInt(videoStartTime, 10) : null,
        videoEndTime: videoEndTime ? parseInt(videoEndTime, 10) : null,
        mediaAspectRatio: mediaAspectRatio || null,
      },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    // Non-blocking background tasks
    import("@/lib/hashtags/hashtag-service").then(({ attachHashtagsToMoment }) => {
      attachHashtagsToMoment(moment.id, caption ?? null, city ?? null, countryCode ?? null).catch((err) => {
        console.error("[CREATE_MOMENT] Hashtag error:", err);
      });
    }).catch(() => {});

    if (audioTrackId) {
      db.audioTrack.update({
        where: { id: audioTrackId },
        data: { usageCount: { increment: 1 } },
      }).catch((err) => {
        console.error("[CREATE_MOMENT] Audio usage error:", err);
      });
    }

    GamificationEngine.trackAction(user.id, ChallengeType.POST_MOMENT).catch(() => {});
    cacheClear("feed:");

    if (city) {
      recordTripHistory({
        userId: user.id,
        city,
        countryCode: countryCode || null,
        source: "MOMENT_PUBLISHED",
        momentId: moment.id,
      }).catch(() => {});
    }

    return NextResponse.json({ moment }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_MOMENT]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
