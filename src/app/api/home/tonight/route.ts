import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";
import {
  type GeoScope,
  EDITORIAL_TIPS,
  safeSection,
  fetchRecommendedPlans,
  fetchFreePlans,
  fetchExpressPlans,
  fetchTrendingMoments,
  fetchSuggestedUsers,
  fetchLiveSessions,
  fetchOfficialTips,
} from "@/lib/home/tonight";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let blockedIds: string[] = [];
  try {
    blockedIds = await getUserBlockedIds(user.id);
  } catch (error) {
    console.error("[HOME_TONIGHT_BLOCKS]", error);
  }

  const scope: GeoScope = {
    city: user.activeCity?.name ?? user.homeCity?.name ?? null,
    cityId: user.activeCityId ?? user.homeCityId,
    countryCode: user.countryCode ?? user.activeCity?.countryCode ?? user.homeCity?.countryCode ?? null,
    blockedIds,
  };

  const [
    recommendedPlans,
    freePlans,
    expressPlans,
    trendingMoments,
    suggestedUsers,
    dailyChallenge,
    cityMission,
    officialTips,
    liveSessions,
  ] = await Promise.all([
    safeSection("PLANS", () => fetchRecommendedPlans(scope), []),
    safeSection("FREE", () => fetchFreePlans(scope), []),
    safeSection("EXPRESS", () => fetchExpressPlans(scope), []),
    safeSection("MOMENTS", () => fetchTrendingMoments(scope), []),
    safeSection("USERS", () => fetchSuggestedUsers(scope, user.id), []),
    safeSection(
      "CHALLENGE",
      () =>
        db.dailyChallenge.findFirst({
          where: { active: true },
          orderBy: { createdAt: "desc" },
        }),
      null
    ),
    safeSection(
      "MISSION",
      () =>
        db.cityMission.findFirst({
          where: {
            active: true,
            ...(scope.city ? { OR: [{ city: scope.city }, { city: null }] } : { city: null }),
          },
          orderBy: { createdAt: "desc" },
        }),
      null
    ),
    safeSection("TIPS", () => fetchOfficialTips(scope), []),
    safeSection("LIVES", () => fetchLiveSessions(scope), []),
  ]);

  const tips =
    officialTips.length > 0
      ? officialTips
      : EDITORIAL_TIPS.map((t) => ({ ...t }));

  return NextResponse.json({
    city: scope.city,
    recommendedPlans,
    freePlans,
    expressPlans,
    trendingMoments,
    suggestedUsers,
    dailyChallenge,
    cityMission,
    officialTips: tips,
    liveSessions,
  });
}
