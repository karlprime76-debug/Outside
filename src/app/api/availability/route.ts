import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";

function parseDuration(duration: string): number {
  const now = new Date();
  switch (duration) {
    case "30min":
      return new Date(now.getTime() + 30 * 60 * 1000).getTime();
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000).getTime();
    case "2h":
      return new Date(now.getTime() + 2 * 60 * 60 * 1000).getTime();
    case "tonight":
      return new Date(now.setHours(23, 59, 59, 999)).getTime();
    default:
      return new Date(now.getTime() + 60 * 60 * 1000).getTime();
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const mine = searchParams.get("mine");

    const now = new Date();

    if (mine) {
      const myAvailability = await db.availability.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ availability: myAvailability });
    }

    const blockedIds = await getUserBlockedIds(user.id);

    const availabilities = await db.availability.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: now },
        userId: { notIn: [user.id, ...blockedIds] },
        ...(city ? { city } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            activeCity: { select: { name: true } },
            homeCity: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error("Availability GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { mood, duration } = body;

    if (!mood || !duration) {
      return NextResponse.json({ error: "Mood et durée requis." }, { status: 400 });
    }

    const city = (user.activeCity?.name ?? user.homeCity?.name) ?? null;
    const country = user.country ?? null;
    const countryCode = user.countryCode ?? null;

    const expiresAt = new Date(parseDuration(duration));

    await db.availability.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    const availability = await db.availability.create({
      data: {
        userId: user.id,
        mood,
        city,
        country,
        countryCode,
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    console.error("Availability POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await db.availability.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Availability DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
