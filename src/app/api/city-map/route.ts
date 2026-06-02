import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's active city name
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { activeCityId: true },
    });

    const activeCity = dbUser?.activeCityId
      ? await db.city.findUnique({ where: { id: dbUser.activeCityId }, select: { id: true, name: true } })
      : null;

    const cityId = activeCity?.id;
    const cityName = activeCity?.name;

    // Plans publics in active city
    const plans = cityId
      ? await db.plan.findMany({
          where: {
            cityId,
            status: "ACTIVE",
            visibility: "PUBLIC",
          },
          orderBy: { startDate: "asc" },
          take: 10,
          include: {
            creator: { select: { id: true, name: true, image: true } },
            city: { select: { name: true } },
            place: { select: { name: true } },
            _count: { select: { participants: true } },
          },
        })
      : [];

    // Lives in active city (status LIVE or SCHEDULED soon)
    const lives = cityName
      ? await db.liveSession.findMany({
          where: {
            city: cityName,
            status: { in: ["LIVE", "SCHEDULED"] },
          },
          orderBy: [{ status: "desc" }, { startedAt: "desc" }],
          take: 10,
          include: {
            host: { select: { id: true, name: true, image: true } },
          },
        })
      : [];

    // Pro events in active city
    const events = cityName
      ? await db.proEvent.findMany({
          where: {
            city: cityName,
            status: "PUBLISHED",
            startsAt: { gte: new Date() },
          },
          orderBy: { startsAt: "asc" },
          take: 10,
          select: {
            id: true,
            title: true,
            category: true,
            coverImageUrl: true,
            city: true,
            venueName: true,
            startsAt: true,
            priceLabel: true,
          },
        })
      : [];

    // Popular places in active city
    const places = cityId
      ? await db.place.findMany({
          where: { cityId, isVisible: true },
          orderBy: { popularityScore: "desc" },
          take: 10,
          select: {
            id: true,
            name: true,
            category: true,
            neighborhood: true,
            images: true,
            popularityScore: true,
            _count: { select: { plans: true } },
          },
        })
      : [];

    // Activity summary by zone (neighborhood / venue)
    const zones = new Map<string, { name: string; plans: number; lives: number; events: number; places: number }>();

    for (const p of plans) {
      const zone = p.neighborhood || p.place?.name || "Centre";
      const existing = zones.get(zone) || { name: zone, plans: 0, lives: 0, events: 0, places: 0 };
      existing.plans++;
      zones.set(zone, existing);
    }

    for (let i = 0; i < lives.length; i++) {
      const zone = "Centre";
      const existing = zones.get(zone) || { name: zone, plans: 0, lives: 0, events: 0, places: 0 };
      existing.lives++;
      zones.set(zone, existing);
    }

    for (const e of events) {
      const zone = e.venueName || "Centre";
      const existing = zones.get(zone) || { name: zone, plans: 0, lives: 0, events: 0, places: 0 };
      existing.events++;
      zones.set(zone, existing);
    }

    for (const p of places) {
      const zone = p.neighborhood || "Centre";
      const existing = zones.get(zone) || { name: zone, plans: 0, lives: 0, events: 0, places: 0 };
      existing.places++;
      zones.set(zone, existing);
    }

    const zonesArray = Array.from(zones.values()).sort(
      (a, b) => b.plans + b.lives + b.events + b.places - (a.plans + a.lives + a.events + a.places)
    );

    const totalActivity = plans.length + lives.length + events.length + places.length;
    let activityLabel = "Calme";
    if (totalActivity >= 5) activityLabel = "Actif";
    if (totalActivity >= 15) activityLabel = "Très actif";

    return NextResponse.json({
      cityName: cityName || "Ta ville",
      activityLabel,
      totalActivity,
      zones: zonesArray,
      plans,
      lives,
      events,
      places,
    });
  } catch (error) {
    console.error("City map error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
