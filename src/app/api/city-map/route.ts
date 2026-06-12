import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Get user's active city name
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { activeCityId: true },
    });

    const activeCity = dbUser?.activeCityId
      ? await db.city.findUnique({ 
          where: { id: dbUser.activeCityId }, 
          select: { id: true, name: true, latitude: true, longitude: true } 
        })
      : null;

    const blockedIds = await getUserBlockedIds(user.id);
    const cityId = activeCity?.id;
    const cityName = activeCity?.name;

    // Parallelize independent city data queries
    const [plans, lives, events, places] = await Promise.all([
      cityId
        ? db.plan.findMany({
            where: {
              cityId,
              status: "ACTIVE",
              visibility: "PUBLIC",
              creatorId: { notIn: blockedIds },
            },
            orderBy: { startDate: "asc" },
            take: 10,
            select: {
              id: true,
              title: true,
              mood: true,
              planCategory: true,
              priceType: true,
              budgetLevel: true,
              budgetAmount: true,
              budgetCurrency: true,
              budgetIsFrom: true,
              status: true,
              isCommunityConfirmed: true,
              neighborhood: true,
              startDate: true,
              latitude: true,
              longitude: true,
              creator: { select: { id: true, name: true, image: true, username: true } },
              city: { select: { name: true } },
              place: { select: { name: true, latitude: true, longitude: true } },
              _count: { select: { participants: true } },
            },
          })
        : Promise.resolve([]),
      cityName
        ? db.liveSession.findMany({
            where: {
              city: cityName,
              status: "LIVE",
              hostId: { notIn: blockedIds },
            },
            orderBy: { startedAt: "desc" },
            take: 10,
            include: {
              host: { select: { id: true, name: true, image: true } },
            },
          })
        : Promise.resolve([]),
      cityName
        ? db.proEvent.findMany({
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
        : Promise.resolve([]),
      cityId
        ? db.place.findMany({
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
              latitude: true,
              longitude: true,
              _count: { select: { plans: true } },
            },
          })
        : Promise.resolve([]),
    ]);

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
      cityCoords: activeCity ? { lat: activeCity.latitude, lng: activeCity.longitude } : null,
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
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
