import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const city = user.activeCity?.name || user.homeCity?.name;
    const countryCode = user.countryCode;

    const [
      recommendedPlans,
      freePlans,
      trendingMoments,
      suggestedUsers,
      dailyChallenge,
      officialTips,
      activeLives,
      expressPlans,
    ] = await Promise.allSettled([
      db.plan.findMany({
        where: {
          city: { name: city },
          status: "ACTIVE",
          startDate: { gte: new Date() },
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { startDate: "asc" },
        take: 3,
      }),
      db.plan.findMany({
        where: {
          city: { name: city },
          status: "ACTIVE",
          budgetLevel: "FREE",
          startDate: { gte: new Date() },
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { startDate: "asc" },
        take: 3,
      }),
      db.moment.findMany({
        where: {
          user: { activeCity: { name: city } },
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { likes: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      db.user.findMany({
        where: {
          activeCity: { name: city },
          id: { not: user.id },
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          activeCity: true,
        },
        take: 5,
      }),
      db.dailyChallenge.findFirst({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      }),
      db.outsideTip.findMany({
        where: {
          active: true,
          OR: [
            { city },
            { countryCode },
            { city: null, countryCode: null },
          ],
        },
        take: 3,
      }),
      db.liveSession.findMany({
        where: {
          status: "ACTIVE",
          user: { activeCity: { name: city } },
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        take: 3,
      }),
      db.plan.findMany({
        where: {
          city: { name: city },
          status: "ACTIVE",
          isExpress: true,
          expiresAt: { gte: new Date() },
        },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          _count: { select: { participants: true } },
        },
        take: 3,
      }),
    ]);

    const userChallengeProgress = dailyChallenge.status === "fulfilled"
      ? await db.userChallengeProgress.findUnique({
          where: {
            userId_challengeKey: {
              userId: user.id,
              challengeKey: dailyChallenge.value.key,
            },
          },
        })
      : null;

    return NextResponse.json({
      city,
      recommendedPlans: recommendedPlans.status === "fulfilled" ? recommendedPlans.value : [],
      freePlans: freePlans.status === "fulfilled" ? freePlans.value : [],
      trendingMoments: trendingMoments.status === "fulfilled" ? trendingMoments.value : [],
      suggestedUsers: suggestedUsers.status === "fulfilled" ? suggestedUsers.value : [],
      dailyChallenge: dailyChallenge.status === "fulfilled" && dailyChallenge.value
        ? {
            ...dailyChallenge.value,
            completed: !!userChallengeProgress?.completedAt,
          }
        : null,
      officialTips: officialTips.status === "fulfilled" ? officialTips.value : [],
      activeLives: activeLives.status === "fulfilled" ? activeLives.value : [],
      expressPlans: expressPlans.status === "fulfilled" ? expressPlans.value : [],
    });
  } catch (error) {
    console.error("[HOME_TONIGHT_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
