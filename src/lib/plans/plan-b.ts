import { db } from "@/lib/db";
import { getUserBlockedIds } from "@/lib/blocks";

export async function getPlanBOptions(planId: string, userId: string) {
  const originalPlan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      creator: { select: { id: true, activeCityId: true } },
      city: { select: { id: true, name: true } },
    },
  });

  if (!originalPlan) {
    return { plans: [], places: [], users: [], moments: [] };
  }

  const cityId = originalPlan.cityId;
  const mood = originalPlan.mood;
  const planCategory = originalPlan.planCategory;
  const blockedIds = await getUserBlockedIds(userId);

  const [similarPlans, places, users, moments, freePlans] = await Promise.all([
    // Similar plans
    db.plan.findMany({
      where: {
        id: { not: planId },
        cityId,
        status: "ACTIVE",
        visibility: "PUBLIC",
        creatorId: { notIn: blockedIds },
        OR: [{ mood }, { planCategory }],
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        participants: { select: { attendance: true } },
      },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    // Active places
    db.place.findMany({
      where: { cityId, isVisible: true },
      include: { city: { select: { id: true, name: true } } },
      orderBy: { popularityScore: "desc" },
      take: 10,
    }),
    // Users with active status
    db.userOutsideStatus.findMany({
      where: {
        city: originalPlan.city.name,
        expiresAt: { gt: new Date() },
        userId: { notIn: blockedIds },
      },
      include: {
        user: {
          select: {
            id: true, name: true, username: true, image: true,
            activeCity: { select: { name: true } },
            userSettings: { select: { privateDiscoveryMode: true } },
          },
        },
      },
      take: 10,
    }),
    // Moments
    db.moment.findMany({
      where: {
        city: originalPlan.city.name,
        authorId: { notIn: blockedIds },
        ...(mood ? { vibe: mood } : {}),
      },
      include: { author: { select: { id: true, name: true, username: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Free plans
    db.plan.findMany({
      where: {
        id: { not: planId },
        cityId,
        status: "ACTIVE",
        visibility: "PUBLIC",
        budgetLevel: "FREE",
        creatorId: { notIn: blockedIds },
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        participants: { select: { attendance: true } },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
  ]);

  return {
    plans: similarPlans.map((plan) => {
      const going = plan.participants.filter((p) => p.attendance === "GOING").length;
      const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
      return { ...plan, _count: { participants: going + maybe, going, maybe } };
    }),
    places,
    users: users.filter((u) => !u.user.userSettings?.privateDiscoveryMode).map((u) => u.user),
    moments,
    freePlans: freePlans.map((plan) => {
      const going = plan.participants.filter((p) => p.attendance === "GOING").length;
      const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
      return { ...plan, _count: { participants: going + maybe, going, maybe } };
    }),
  };
}
