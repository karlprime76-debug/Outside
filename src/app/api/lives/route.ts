import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { activeCity: { select: { name: true } } },
  });

  const city = user?.activeCity?.name;

  const lives = await db.liveSession.findMany({
    where: {
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
    take: 50,
  });

  return NextResponse.json({ lives });
}

export async function POST(req: Request) {
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

  return NextResponse.json({ live, message: "Live créé." }, { status: 201 });
}
