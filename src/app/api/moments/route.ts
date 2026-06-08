import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";
import { recordTripHistory } from "@/lib/passport";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateMomentFile, buildMomentPath, ensureMomentsBucket, MOMENTS_BUCKET } from "@/lib/supabase/moments-storage";
import { MomentVisibility } from "@prisma/client";
import { buildFeed } from "@/lib/algorithm/feed-builder";

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
            _count: { select: { likes: true, comments: true } },
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
            _count: m._count,
            viewerState: { likedByMe: false, canDelete: false, canReport: true },
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

    const validation = validateMomentFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(MOMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
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

    const moment = await db.moment.create({
      data: {
        authorId: user.id,
        type: file.type.startsWith("video/") ? "VIDEO" : "PHOTO",
        mediaUrl,
        caption,
        visibility: visibility as MomentVisibility,
        city,
        countryCode,
        planId,
        placeId,
        eventId,
        liveId,
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

    if (audioTrackId) {
      await db.audioTrack.update({
        where: { id: audioTrackId },
        data: { usageCount: { increment: 1 } },
      }).catch((err) => {
        console.error("[POST /api/moments] Background task error:", err);
      });
    }

    if (city) {
      recordTripHistory({
        userId: user.id,
        city,
        countryCode,
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
