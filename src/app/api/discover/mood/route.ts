import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const mood = searchParams.get("mood");
    const city = searchParams.get("city");

    if (!mood) {
      return NextResponse.json({ error: "Mood parameter is required" }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      visibility: "PUBLIC",
    };

    if (mood) {
      where.mood = mood;
    }

    if (city) {
      where.city = { name: city };
    } else if (user?.activeCityId) {
      where.cityId = user.activeCityId;
    }

    // Get plans matching the mood
    const plans = await db.plan.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        participants: { select: { attendance: true } },
      },
      orderBy: { startDate: "asc" },
      take: 20,
    });

    const plansWithCounts = plans.map((plan) => {
      const going = plan.participants.filter((p) => p.attendance === "GOING").length;
      const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
      return {
        ...plan,
        _count: { participants: going + maybe, going, maybe },
      };
    });

    // Get places in the city (category filter removed for type compatibility)
    const places = await db.place.findMany({
      where: {
        isVisible: true,
        ...(city ? { city: { name: city } } : {}),
        ...(user?.activeCityId && !city ? { cityId: user.activeCityId } : {}),
      },
      include: {
        city: { select: { id: true, name: true } },
      },
      orderBy: { popularityScore: "desc" },
      take: 10,
    });

    // Get users with outside status matching the mood
    const moodToStatusMap: Record<string, "OUT_NOW" | "AVAILABLE" | "LOOKING_FOR_FOOD" | "LOOKING_FOR_CHILL" | "LOOKING_FOR_SPORT" | "LOOKING_FOR_MUSIC" | "DO_NOT_DISTURB"> = {
      FOOD: "LOOKING_FOR_FOOD",
      CHILL: "LOOKING_FOR_CHILL",
      SPORT: "LOOKING_FOR_SPORT",
      MUSIC: "LOOKING_FOR_MUSIC",
    };

    const statusType = moodToStatusMap[mood];
    const users = statusType
      ? await db.userOutsideStatus.findMany({
          where: {
            type: statusType,
            expiresAt: { gt: new Date() },
            ...(city ? { city } : {}),
            ...(user?.activeCityId && !city ? { city: user.activeCity?.name } : {}),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                activeCity: { select: { name: true } },
              },
            },
          },
          take: 10,
        })
      : [];

    // Get moments matching the mood
    const moments = await db.moment.findMany({
      where: {
        ...(mood ? { vibe: mood } : {}),
        ...(city ? { city } : {}),
        ...(user?.activeCityId && !city ? { city: user.activeCity?.name } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      plans: plansWithCounts,
      places,
      users: users.map((u) => u.user),
      moments,
    });
  } catch (error) {
    console.error("[DISCOVER_MOOD_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
