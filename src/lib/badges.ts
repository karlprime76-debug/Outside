import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

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

  createNotification({
    type: "BADGE_EARNED",
    title: "Badge obtenu !",
    body: `Tu as débloqué le badge "${badge.name}"`,
    recipientId: userId,
    data: { badgeId: badge.id, badgeKey: badge.key },
  }).catch(() => {});

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
      plan: { planCategory: "FOOD" },
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

// Founder badges logic
export async function evaluateFounderBadges(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      acceptedReferral: true,
    },
  });

  if (!user) return;

  const totalUsers = await db.user.count();
  const FOUNDER_THRESHOLD = 1000;

  if (totalUsers <= FOUNDER_THRESHOLD && !user.acceptedReferral) {
    await awardBadge(userId, "founder_member");
  }

  if (user.acceptedReferral) {
    await awardBadge(userId, "circle_launched");
  }

  const momentsCount = await db.moment.count({
    where: { authorId: userId },
  });

  if (momentsCount === 1) {
    await awardBadge(userId, "founder_creator");
  }

  const plansCount = await db.plan.count({
    where: { creatorId: userId },
  });

  if (plansCount === 1) {
    await awardBadge(userId, "founder_organizer");
  }

  if (user.isAmbassador) {
    await awardBadge(userId, "ambassador_city");
  }
}

export async function evaluateBadgesAfterMomentCreated(userId: string) {
  await evaluateFounderBadges(userId);
  await evaluateBadgesAfterPlanCreated(userId);
}

export async function evaluateCheckinBadge(userId: string) {
  const checkinCount = await db.planParticipant.count({
    where: { userId, checkedInAt: { not: null } },
  });

  if (checkinCount >= 5) {
    await awardBadge(userId, "punctual");
  }
}
