import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const city = user.activeCity?.name ?? null;
    const countryCode = user.countryCode ?? null;
    const cityId = user.activeCityId;

    // Get recommended plans (plans today in city)
    const recommendedPlans = cityId ? await db.plan.findMany({
      where: {
        cityId: cityId,
        startDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
        status: "ACTIVE",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        city: true,
      },
      orderBy: { startDate: "asc" },
      take: 3,
    }) : [];

    // Get free plans
    const freePlans = cityId ? await db.plan.findMany({
      where: {
        cityId: cityId,
        budgetLevel: "FREE",
        startDate: {
          gte: new Date(),
        },
        status: "ACTIVE",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        city: true,
      },
      orderBy: { startDate: "asc" },
      take: 3,
    }) : [];

    // Get trending moments (recent moments in city)
    const trendingMoments = city ? await db.moment.findMany({
      where: {
        city: city,
        visibility: "PUBLIC",
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
      take: 3,
    }) : [];

    // Get suggested users (active users in city)
    const suggestedUsers = cityId ? await db.user.findMany({
      where: {
        activeCityId: cityId,
        isAvailable: true,
        userSettings: {
          privateDiscoveryMode: false,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isVerified: true,
      },
      take: 3,
    }) : [];

    // Get daily challenge
    const dailyChallenge = await db.dailyChallenge.findFirst({
      where: { active: true },
    });

    // Get official tips for city/country
    const officialTips = await db.outsideTip.findMany({
      where: {
        active: true,
        OR: [
          ...(city ? [{ city: city }] : []),
          ...(countryCode ? [{ countryCode: countryCode }] : []),
          { city: null, countryCode: null },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Get live sessions
    const liveSessions = city ? await db.liveSession.findMany({
      where: {
        status: "LIVE",
        city: city,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      take: 2,
    }) : [];

    return NextResponse.json({
      city,
      recommendedPlans,
      freePlans,
      trendingMoments,
      suggestedUsers,
      dailyChallenge,
      officialTips,
      liveSessions,
    });
  } catch (error) {
    console.error("[HOME_TONIGHT_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
