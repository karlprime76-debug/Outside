import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { getUserBlockedIds } from "@/lib/blocks";
import { notifyLiveStarted } from "@/lib/live-notifications";
import { createLiveSchema } from "@/lib/validation/schemas";
import { createLiveKitRoom, getLiveKitParticipantCount } from "@/lib/livekit";

const HEARTBEAT_TIMEOUT_MS = 60_000;

async function autoEndStaleLives() {
  const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);
  const stale = await db.liveSession.findMany({
    where: {
      status: "LIVE",
      lastHeartbeatAt: { lt: cutoff },
    },
    select: { id: true, livekitRoomName: true },
  });

  for (const live of stale) {
    const roomName = live.livekitRoomName || `outside-live-${live.id}`;
    const count = await getLiveKitParticipantCount(live.id);
    if (count === 0) {
      db.liveSession.update({
        where: { id: live.id },
        data: { status: "ENDED", endedAt: new Date() },
      }).catch((err) => console.error("[AUTO_END]", err));
    }
  }
}

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/lives";
  logPerfStart(perfLabel);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    // Auto-cleanup stale lives (fire-and-forget, non-blocking)
    autoEndStaleLives().catch((err) => console.error("[AUTO_END]", err));

    const { searchParams } = new URL(req.url);
    let limit = parseInt(searchParams.get("limit") || "50", 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 50) limit = 50;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { activeCity: { select: { name: true } } },
    });

    const city = user?.activeCity?.name ?? null;

    const blockedIds = await getUserBlockedIds(session.user.id);

    const DEMO_GLOBAL = process.env.DEMO_GLOBAL_VISIBILITY === "1" || process.env.DEMO_GLOBAL_VISIBILITY === "true";
    const lives = await db.liveSession.findMany({
      where: DEMO_GLOBAL
        ? {
            OR: [
              {
                status: "LIVE",
                ...(city ? { city } : {}),
                hostId: { notIn: blockedIds },
              },
              {
                isDemo: true,
                status: "LIVE",
              },
            ],
          }
        : {
            status: "LIVE",
            ...(city ? { city } : {}),
            hostId: { notIn: blockedIds },
          },
      orderBy: { createdAt: "desc" },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
      take: limit,
    });

    // Enrich with real-time viewer count from LiveKit
    const enriched = await Promise.all(
      lives.map(async (l) => {
        const roomName = l.livekitRoomName || `outside-live-${l.id}`;
        const viewerCount = await getLiveKitParticipantCount(l.id);
        return { ...l, viewerCount };
      })
    );

    logPerfEnd(perfLabel);
    return NextResponse.json({ lives: enriched });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[LIVE_ERROR]", "GET /api/lives failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const perfLabel = "[PERF] POST /api/lives";
  logPerfStart(perfLabel);
  try {
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 100000) {
      logPerfEnd(perfLabel);
      return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, activeCity: { select: { name: true, country: true, countryCode: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createLiveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { title, description, visibility, city, country, countryCode, planId, eventId, placeId, status: requestedStatus } = body;

    const liveCity = city || user.activeCity?.name;
    if (!liveCity) {
      return NextResponse.json({ error: "Une ville est requise pour créer un live." }, { status: 400 });
    }

    const live = await db.liveSession.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        visibility: visibility || "CITY",
        city: liveCity,
        country: country || user.activeCity?.country || null,
        countryCode: countryCode || user.activeCity?.countryCode || null,
        hostId: user.id,
        planId: planId || null,
        eventId: eventId || null,
        placeId: placeId || null,
        status: requestedStatus === "LIVE" ? "LIVE" : "SCHEDULED",
        startedAt: requestedStatus === "LIVE" ? new Date() : null,
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
    });

    // Set room name and pre-create LiveKit room
    const roomName = `outside-live-${live.id}`;
    await db.liveSession.update({
      where: { id: live.id },
      data: { livekitRoomName: roomName },
    });

    if (requestedStatus === "LIVE") {
      createLiveKitRoom(live.id).catch((err) => { console.error("[LIVEKIT_CREATE_ROOM]", err); });
    }

    // Notifier si le live est créé directement en LIVE
    if (live.status === "LIVE") {
      notifyLiveStarted(live.id).catch((err) => { logError("[LIVE_ERROR]", "Failed to notify live started", { error: String(err) }); });
    }

    logPerfEnd(perfLabel);
    return NextResponse.json({ live, message: "Live créé." }, { status: 201 });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[LIVE_ERROR]", "POST /api/lives failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
