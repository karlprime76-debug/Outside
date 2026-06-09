import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blockedIds = await getUserBlockedIds(user.id);

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
        creatorId: { notIn: blockedIds },
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
        creatorId: { notIn: blockedIds },
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

    // Get express plans (TONIGHT/NOW mood or created within last 6h for tonight)
    const expressPlans = cityId ? await db.plan.findMany({
      where: {
        cityId: cityId,
        status: "ACTIVE",
        creatorId: { notIn: blockedIds },
        OR: [
          { mood: "TONIGHT" },
          { mood: "NOW" },
          {
            createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
            startDate: { gte: new Date() },
          },
        ],
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
      orderBy: { createdAt: "desc" },
      take: 3,
    }) : [];

    // Get trending moments (recent moments in city)
    const trendingMoments = city ? await db.moment.findMany({
      where: {
        city: city,
        visibility: "PUBLIC",
        authorId: { notIn: blockedIds },
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
        id: { notIn: blockedIds },
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

    // Get city mission for today
    const cityMission = await db.cityMission.findFirst({
      where: {
        active: true,
        ...(city ? { OR: [{ city: city }, { city: null }] } : {}),
      },
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
        hostId: { notIn: blockedIds },
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
      expressPlans,
      trendingMoments,
      suggestedUsers,
      dailyChallenge,
      cityMission,
      officialTips,
      liveSessions,
    });
  } catch (error) {
    console.error("[HOME_TONIGHT_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
