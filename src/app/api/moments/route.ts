import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";
import { recordTripHistory } from "@/lib/passport";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateMomentFile, buildMomentPath, ensureMomentsBucket, MOMENTS_BUCKET, ALLOWED_MOMENT_TYPES } from "@/lib/supabase/moments-storage";
import { validateFileByMagicBytes } from "@/lib/files/magic-bytes";
import { MomentVisibility, ChallengeType } from "@prisma/client";
import { buildFeed } from "@/lib/algorithm/feed-builder";
import { createMomentSchema } from "@/lib/validation/schemas";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { GamificationEngine } from "@/lib/gamification-engine";
import { optimizeImage } from "@/lib/media/optimize-image";
import { cacheClear } from "@/lib/cache";


export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/moments";
  logPerfStart(perfLabel);

  try {
    const user = await getCurrentUser();
    const DEMO_GLOBAL = process.env.DEMO_GLOBAL_VISIBILITY === "1" || process.env.DEMO_GLOBAL_VISIBILITY === "true";
    if (!user) {
      if (DEMO_GLOBAL) {
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");
        let limit = parseInt(searchParams.get("limit") || "10", 10);
        if (isNaN(limit) || limit < 1) limit = 10;
        if (limit > 20) limit = 20;
        const now = new Date();

        const moments = await db.moment.findMany({
          where: { isDemo: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          include: {
            author: { select: { id: true, name: true, username: true, image: true, role: true, isVerified: true } },
            _count: { select: { reactions: true, comments: true } },
          },
        });

        logPerfEnd(perfLabel);
        return NextResponse.json({
          moments: moments.map((m) => ({
            id: m.id,
            type: m.type,
            mediaUrl: m.mediaUrl,
            caption: m.caption,
            city: m.city,
            countryCode: m.countryCode,
            visibility: m.visibility,
            createdAt: m.createdAt.toISOString(),
            author: m.author,
            _count: { reactions: m._count.reactions, comments: m._count.comments },
            viewerState: { likedByMe: false, myReaction: null, savedByMe: false, canDelete: false, canReport: true },
          })),
          nextCursor: moments.length === limit ? moments[moments.length - 1].id : null,
        });
      }
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : null;
    let limit = parseInt(searchParams.get("limit") || "10", 10);
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 20) limit = 20;
    const scope = (searchParams.get("scope") || "for-you") as "for-you" | "city" | "friends" | "following";
    const media = (searchParams.get("media") || "all").toLowerCase() as "all" | "posts" | "clips";

    // Parallelize social graph lookups
    const [friendRows, followingRows] = await Promise.all([
      db.friendship.findMany({
        where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
        select: { initiatorId: true, receiverId: true },
      }),
      db.follow.findMany({ where: { followerId: user.id }, select: { followingId: true } }),
    ]);
    const friendIds = friendRows.map((f) => (f.initiatorId === user.id ? f.receiverId : f.initiatorId));
    const followingIds = followingRows.map((f) => f.followingId);

    const { moments, nextCursor } = await buildFeed(
      {
        userId: user.id,
        activeCity: user.activeCity?.name ?? null,
        countryCode: user.countryCode ?? null,
        role: user.role,
        friendIds,
        followingIds,
      },
      scope,
      limit,
      cursor ?? undefined,
      since,
      media
    );

    logPerfEnd(perfLabel);
    return NextResponse.json({ moments, nextCursor });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[MOMENT_ERROR]", "GET /api/moments failed", { error: String(error) });
    // Return empty array instead of error when no data exists
    return NextResponse.json({ moments: [], nextCursor: null });
  }
}

export async function POST(req: Request) {
  try {
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 104_857_600) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 100 Mo)." }, { status: 413 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const caption = (formData.get("caption") as string | null)?.trim() || null;
    const visibility = (formData.get("visibility") as string) || "PUBLIC";
    const city = (formData.get("city") as string | null) || null;
    const countryCode = (formData.get("countryCode") as string | null) || null;
    const planId = (formData.get("planId") as string | null) || null;
    const placeId = (formData.get("placeId") as string | null) || null;
    const eventId = (formData.get("eventId") as string | null) || null;
    const liveId = (formData.get("liveId") as string | null) || null;
    const audioTrackId = (formData.get("audioTrackId") as string | null) || null;
    const audioStartTime = parseInt((formData.get("audioStartTime") as string) || "0", 10);
    const audioVolume = parseFloat((formData.get("audioVolume") as string) || "1");

    // Media editing metadata
    const mediaWidth = parseInt((formData.get("mediaWidth") as string) || "0", 10) || null;
    const mediaHeight = parseInt((formData.get("mediaHeight") as string) || "0", 10) || null;
    const mediaDuration = parseInt((formData.get("mediaDuration") as string) || "0", 10) || null;
    const mediaCrop = formData.get("mediaCrop") as string | null;
    const videoStartTime = parseInt((formData.get("videoStartTime") as string) || "0", 10) || null;
    const videoEndTime = parseInt((formData.get("videoEndTime") as string) || "0", 10) || null;
    const mediaAspectRatio = (formData.get("mediaAspectRatio") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const momentLimit = await rateLimit(`moment:${user.id}`, 20, 3600000);
    if (!momentLimit.success) {
      return NextResponse.json(
        { error: "Trop de moments publiés. Réessaie plus tard." },
        { status: 429, headers: getRateLimitHeaders(momentLimit) }
      );
    }

    const validation = validateMomentFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const magicCheck = await validateFileByMagicBytes(file, ALLOWED_MOMENT_TYPES);
    if (!magicCheck.ok) {
      return NextResponse.json({ error: "Le fichier ne correspond pas au format déclaré." }, { status: 400 });
    }

    const expiresIn = formData.get("expiresIn") as string | null;
    const momentFields = { caption, visibility, city, countryCode, planId, placeId, eventId, liveId, expiresIn };
    const parsed = createMomentSchema.safeParse(momentFields);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { caption: parsedCaption, visibility: parsedVisibility, city: parsedCity, countryCode: parsedCountryCode, planId: parsedPlanId, placeId: parsedPlaceId, eventId: parsedEventId, liveId: parsedLiveId, expiresIn: parsedExpiresIn } = parsed.data;

    // Compute expiresAt from expiresIn duration string
    let expiresAt: Date | undefined;
    const expiresInValue = parsedExpiresIn ?? expiresIn;
    if (expiresInValue) {
      const match = expiresInValue.match(/^(\d+)([hd])$/);
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

    let supabase;
    try {
      supabase = createSupabaseServerClient();
    } catch {
      return NextResponse.json({ error: "Supabase Storage non configuré." }, { status: 500 });
    }

    await ensureMomentsBucket(supabase);

    const filePath = buildMomentPath(user.id, file.type);
    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(arrayBuffer as ArrayBuffer);
    let contentType = file.type;

    // Optimize images (resize + convert to WebP)
    if (file.type.startsWith("image/") && file.type !== "image/gif") {
      try {
        const optimized = await optimizeImage(buffer, file.type);
        buffer = optimized.buffer;
        contentType = optimized.mimeType;
      } catch (err) {
        console.error("[MOMENT_OPTIMIZE_IMAGE]", err);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(MOMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Moment upload error:", uploadError);
      return NextResponse.json({ error: "Impossible d'envoyer le fichier." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(MOMENTS_BUCKET).getPublicUrl(filePath);
    const mediaUrl = publicUrlData.publicUrl;

    const parsedMediaCrop = mediaCrop ? (() => {
      try {
        return JSON.parse(mediaCrop);
      } catch (e) {
        console.error("[POST /api/moments] Invalid mediaCrop JSON:", { mediaCrop, error: e });
        return null;
      }
    })() : null;

    const momentType = file.type.startsWith("video/") ? "VIDEO" : "PHOTO";
    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        type: momentType,
        mediaUrl,
        caption: parsedCaption,
        expiresAt,
        visibility: (parsedVisibility ?? "PUBLIC") as MomentVisibility,
        city: parsedCity,
        countryCode: parsedCountryCode,
        planId: parsedPlanId,
        placeId: parsedPlaceId,
        eventId: parsedEventId,
        liveId: parsedLiveId,
        audioTrackId,
        audioStartTime: isNaN(audioStartTime) ? 0 : audioStartTime,
        audioVolume: isNaN(audioVolume) ? 1 : Math.min(1, Math.max(0, audioVolume)),
        // Media editing metadata
        mediaWidth,
        mediaHeight,
        mediaDuration,
        mediaCrop: parsedMediaCrop,
        videoStartTime,
        videoEndTime,
        mediaAspectRatio,
      },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    // Attach hashtags from caption (deferred, non-blocking)
    import("@/lib/hashtags/hashtag-service").then(({ attachHashtagsToMoment }) => {
      attachHashtagsToMoment(moment.id, parsedCaption ?? null, parsedCity ?? null, parsedCountryCode ?? null).catch((err) => {
        console.error("[POST /api/moments] Background hashtag error:", err);
      });
    });

    if (audioTrackId) {
      await db.audioTrack.update({
        where: { id: audioTrackId },
        data: { usageCount: { increment: 1 } },
      }).catch((err) => {
        console.error("[POST /api/moments] Background task error:", err);
      });
    }

    GamificationEngine.trackAction(user.id, ChallengeType.POST_MOMENT).catch((err) => {
      console.error("[GAMIFICATION_ERROR]", err);
    });

    // Invalidate feed cache so new moments appear immediately
    cacheClear("feed:");

    if (parsedCity) {
      recordTripHistory({
        userId: user.id,
        city: parsedCity,
        countryCode: parsedCountryCode,
        source: "MOMENT_PUBLISHED",
        momentId: moment.id,
      }).catch((err) => {
        console.error("[POST /api/moments] Background task error:", err);
      });
    }

    return NextResponse.json({ moment }, { status: 201 });
  } catch (error) {
    console.error("Create moment error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}











