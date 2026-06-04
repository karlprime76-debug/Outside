import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/lives";
  logPerfStart(perfLabel);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let limit = parseInt(searchParams.get("limit") || "50", 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 50) limit = 50;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { activeCity: { select: { name: true } } },
    });

    const city = user?.activeCity?.name;

    const DEMO_GLOBAL = process.env.DEMO_GLOBAL_VISIBILITY === "1" || process.env.DEMO_GLOBAL_VISIBILITY === "true";
    const lives = await db.liveSession.findMany({
      where: DEMO_GLOBAL
        ? {
            OR: [
              {
                status: { in: ["LIVE", "SCHEDULED"] },
                ...(city ? { city } : {}),
              },
              {
                isDemo: true,
                status: { in: ["LIVE", "SCHEDULED"] },
              },
            ],
          }
        : {
            status: { in: ["LIVE", "SCHEDULED"] },
            ...(city ? { city } : {}),
          },
      orderBy: [
        { status: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
      take: limit,
    });

    logPerfEnd(perfLabel);
    return NextResponse.json({ lives });
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
    const { title, description, visibility, city, country, countryCode, planId, eventId, placeId, status: requestedStatus } = body;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json({ error: "Le titre est requis." }, { status: 400 });
    }

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

    // Générer le nom de room LiveKit stable
    await db.liveSession.update({
      where: { id: live.id },
      data: { livekitRoomName: `outside-live-${live.id}` },
    });

    const liveWithRoom = await db.liveSession.findUnique({
      where: { id: live.id },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
    });

    logPerfEnd(perfLabel);
    return NextResponse.json({ live: liveWithRoom, message: "Live créé." }, { status: 201 });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[LIVE_ERROR]", "POST /api/lives failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
