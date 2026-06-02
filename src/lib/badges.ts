import { db } from "@/lib/db";

export async function awardBadge(userId: string, badgeKey: string): Promise<boolean> {
  const badge = await db.badge.findUnique({ where: { key: badgeKey } });
  if (!badge) return false;

  const existing = await db.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return false;

  await db.userBadge.create({
    data: { userId, badgeId: badge.id },
  });

  return true;
}

export async function getUserBadges(userId: string) {
  return db.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });
}

export async function evaluateBadgesAfterPlanCreated(userId: string) {
  const createdCount = await db.plan.count({ where: { creatorId: userId } });

  if (createdCount >= 1) {
    await awardBadge(userId, "first_plan_created");
  }

  if (createdCount >= 5) {
    await awardBadge(userId, "reliable_organizer");
  }

  // Explorer : plans in 3+ different cities
  const cities = await db.plan.findMany({
    where: { creatorId: userId },
    select: { cityId: true },
    distinct: ["cityId"],
  });
  if (cities.length >= 3) {
    await awardBadge(userId, "explorer");
  }
}

export async function evaluateBadgesAfterPlanJoined(userId: string) {
  const joinedCount = await db.planParticipant.count({
    where: { userId, status: { in: ["PENDING", "CONFIRMED"] } },
  });

  if (joinedCount >= 1) {
    await awardBadge(userId, "first_plan_joined");
  }

  if (joinedCount >= 10) {
    await awardBadge(userId, "always_outside");
  }

  // Food hunter : 3+ food plans
  const foodCount = await db.planParticipant.count({
    where: {
      userId,
      status: { in: ["PENDING", "CONFIRMED"] },
      plan: { category: "RESTAURANT" },
    },
  });
  if (foodCount >= 3) {
    await awardBadge(userId, "food_hunter");
  }

  // Night life : 3+ party plans
  const partyCount = await db.planParticipant.count({
    where: {
      userId,
      status: { in: ["PENDING", "CONFIRMED"] },
      plan: { mood: "PARTY" },
    },
  });
  if (partyCount >= 3) {
    await awardBadge(userId, "night_life");
  }

  // Sportif : 3+ sport plans
  const sportCount = await db.planParticipant.count({
    where: {
      userId,
      status: { in: ["PENDING", "CONFIRMED"] },
      plan: { mood: "SPORT" },
    },
  });
  if (sportCount >= 3) {
    await awardBadge(userId, "sportif");
  }

  // Traveler : joined a traveler-friendly plan
  const travelerPlan = await db.planParticipant.findFirst({
    where: { userId, plan: { isTravelerFriendly: true } },
  });
  if (travelerPlan) {
    await awardBadge(userId, "traveler");
  }
}
