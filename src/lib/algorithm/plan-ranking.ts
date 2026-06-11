import { Mood, BudgetLevel } from "@prisma/client";

export interface PlanRankingContext {
  userId: string;
  preferredMoods: Mood[];
  preferredBudget: BudgetLevel | null;
  activeCityId: string | null;
  friendIds: Set<string>;
  fofIds: Set<string>;
  blockedIds: Set<string>;
  historicCreatorIds: Set<string>;
  historicMoods: Set<Mood>;
}

export interface PlanCandidate {
  id: string;
  creatorId: string;
  mood: Mood;
  budgetLevel: BudgetLevel;
  cityId: string;
  isOfficial: boolean;
  startDate: Date;
  createdAt: Date;
  creator: {
    trustScore: number;
    isVerified: boolean;
  };
  participants: { userId: string }[];
}

export function getPlanRankingScore(
  plan: PlanCandidate,
  viewer: PlanRankingContext
): number {
  let score = 0;

  // 1. Mood Match (Very important for personal interest)
  if (viewer.preferredMoods.includes(plan.mood)) {
    score += 30;
  }

  // 2. Budget Match
  if (viewer.preferredBudget && plan.budgetLevel === viewer.preferredBudget) {
    score += 15;
  }

  // 3. Social Boost (Friends going is a huge signal)
  const participantIds = new Set(plan.participants.map(p => p.userId));
  let friendsGoing = 0;
  for (const fId of viewer.friendIds) {
    if (participantIds.has(fId)) friendsGoing++;
  }
  
  if (friendsGoing > 0) {
    score += Math.min(40, friendsGoing * 10); // Up to 40 points
  }

  // Creator is a friend
  if (viewer.friendIds.has(plan.creatorId)) {
    score += 20;
  }
  
  // Creator is a FOF
  if (viewer.fofIds.has(plan.creatorId)) {
    score += 10;
  }

  // 4. Official/PRO Boost
  if (plan.isOfficial) {
    score += 25;
  }

  // 5. Proximity
  if (viewer.activeCityId && plan.cityId === viewer.activeCityId) {
    score += 20;
  }

  // 6. Creator Trust & Quality
  if (plan.creator.isVerified) {
    score += 10;
  }
  score += (plan.creator.trustScore / 10); // Up to 10 points for 100 trust score

  // History Boost
  if (viewer.historicCreatorIds.has(plan.creatorId)) {
    score += 15; // I liked this creator's plans before
  }
  if (viewer.historicMoods.has(plan.mood)) {
    score += 10; // I joined plans with this mood before
  }

  // 7. Freshness / Imminence
  const now = Date.now();
  const timeToStart = plan.startDate.getTime() - now;
  const hoursToStart = timeToStart / (1000 * 60 * 60);

  if (hoursToStart > 0 && hoursToStart < 24) {
    score += 15; // Today's plans
  } else if (hoursToStart > 0 && hoursToStart < 72) {
    score += 5; // Next 3 days
  }

  // 8. Blocked Filter (safety)
  if (viewer.blockedIds.has(plan.creatorId)) {
    score -= 1000;
  }

  return score;
}
