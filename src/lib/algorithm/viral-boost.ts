import { db } from "@/lib/db";

export type ViralLevel = 0 | 1 | 2 | 3;

export function getViralLevel(momentScore: {
  score: number;
  viralScore: number;
  qualityScore: number;
  safetyScore: number;
  completions: number;
  views: number;
  shares: number;
  reports: number;
  impressions: number;
  likes: number;
}): ViralLevel {
  if (momentScore.safetyScore < 0.5) return 0;

  const completionRate = momentScore.views > 0 ? momentScore.completions / momentScore.views : 0;
  const shareRate = momentScore.views > 0 ? momentScore.shares / momentScore.views : 0;
  const reportRate = momentScore.impressions > 0 ? momentScore.reports / momentScore.impressions : 0;
  const likeRate = momentScore.views > 0 ? momentScore.likes / momentScore.views : 0;

  // LEVEL 3: Global discovery
  if (
    momentScore.score >= 80 &&
    completionRate >= 0.6 &&
    shareRate >= 0.05 &&
    reportRate < 0.005 &&
    momentScore.qualityScore >= 50
  ) {
    return 3;
  }

  // LEVEL 2: Local viral
  if (
    momentScore.score >= 50 &&
    completionRate >= 0.45 &&
    shareRate >= 0.02 &&
    reportRate < 0.01 &&
    likeRate >= 0.1
  ) {
    return 2;
  }

  // LEVEL 1: Promising
  if (
    momentScore.score >= 25 &&
    completionRate >= 0.35 &&
    reportRate < 0.02 &&
    momentScore.views >= 10
  ) {
    return 1;
  }

  // LEVEL 0: New / unboosted
  return 0;
}

export async function shouldBoostMoment(momentId: string): Promise<boolean> {
  const score = await db.momentScore.findUnique({
    where: { momentId },
  });

  if (!score) return false;

  const level = getViralLevel(score);
  return level >= 1;
}

export async function getBoostAudience(
  momentId: string
): Promise<{ city?: string; countryCode?: string } | null> {
  const [moment, score] = await Promise.all([
    db.moment.findUnique({ where: { id: momentId }, select: { city: true, countryCode: true } }),
    db.momentScore.findUnique({ where: { momentId } }),
  ]);

  if (!moment || !score) return null;

  const level = getViralLevel(score);

  // Level 3: global, no city restriction
  if (level === 3) {
    return { city: undefined, countryCode: undefined };
  }

  // Level 2: boost within same city/country
  if (level === 2) {
    return { city: moment.city ?? undefined, countryCode: moment.countryCode ?? undefined };
  }

  // Level 1: friends, followers, and city
  if (level === 1) {
    return { city: moment.city ?? undefined, countryCode: moment.countryCode ?? undefined };
  }

  return null;
}

export async function updateViralScore(momentId: string): Promise<void> {
  const score = await db.momentScore.findUnique({ where: { momentId } });
  if (!score) return;

  const level = getViralLevel(score);

  // Viral score multiplier based on level
  const multipliers = [0, 10, 25, 50];
  const viralScore = score.score * multipliers[level];

  await db.momentScore.update({
    where: { momentId },
    data: { viralScore },
  });
}

// Never boost these
export async function isBoostBlocked(momentId: string): Promise<boolean> {
  const [moment, score, reportCount] = await Promise.all([
    db.moment.findUnique({
      where: { id: momentId },
      select: { visibility: true, authorId: true },
    }),
    db.momentScore.findUnique({ where: { momentId } }),
    db.report.count({
      where: { targetType: "MOMENT", targetId: momentId, status: { not: "DISMISSED" } },
    }),
  ]);

  if (!moment) return true;

  // Private moments
  if (moment.visibility !== "PUBLIC") return true;

  // Reported multiple times
  if (reportCount >= 2) return true;

  // Low safety score
  if (score && score.safetyScore < 0.4) return true;

  return false;
}
