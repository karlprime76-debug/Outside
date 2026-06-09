import { db } from "@/lib/db";

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

export interface UserQualityFactors {
  profileComplete: boolean;
  isVerified: boolean;
  trustScore: number;
  reportRate: number;
  publishRegularity: number;
  avgEngagementRate: number;
  organicFollowersRate: number;
  planParticipation: number;
  spamSignals: number;
  contentHiddenRate: number;
  repetitiveContentRate: number;
}

export async function calculateUserQualityScore(userId: string): Promise<number> {
  const now = new Date();

  const [user, momentCounts, followerData, reportData, planCount, userMoments, hiddenContent, spamReports] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isVerified: true,
        trustScore: true,
        createdAt: true,
      },
    }),
    db.moment.groupBy({
      by: ["createdAt"],
      where: { authorId: userId },
      _count: { id: true },
    }),
    db.follow.groupBy({
      by: ["createdAt"],
      where: { followingId: userId },
      _count: { id: true },
    }),
    db.report.groupBy({
      by: ["createdAt"],
      where: { targetId: userId, targetType: "USER" },
      _count: { id: true },
    }),
    db.planParticipant.count({
      where: { userId },
    }),
    db.moment.findMany({
      where: { authorId: userId },
      select: { id: true },
    }),
    db.moment.count({
      where: { authorId: userId, visibility: "PRIVATE" },
    }),
    db.report.count({
      where: { targetId: userId, targetType: "USER", reason: "SPAM" },
    }),
  ]);

  const momentIds = userMoments.map((m) => m.id);

  const momentScores = momentIds.length > 0
    ? await db.momentScore.aggregate({
        where: { momentId: { in: momentIds } },
        _avg: { likes: true, views: true, comments: true },
      })
    : { _avg: { likes: null, views: null, comments: null } };

  if (!user) return 50;

  // Profile completeness
  const profileComplete = !!user.name && !!user.username && !!user.image;

  // Trust score
  const trustScore = user.trustScore || 50;

  // Publish regularity (moments in last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - DAYS_30);
  const recentMoments = momentCounts.filter((m) => new Date(m.createdAt) >= thirtyDaysAgo);
  const publishRegularity = Math.min(1, recentMoments.length / 10); // 10+ moments in 30 days = max

  // Organic followers rate (followers gained in last 30 days vs total)
  const thirtyDaysAgoFollow = new Date(now.getTime() - DAYS_30);
  const recentFollowers = followerData.filter((f) => new Date(f.createdAt) >= thirtyDaysAgoFollow);
  const totalFollowers = followerData.length;
  const organicFollowersRate = totalFollowers > 0 ? Math.min(1, recentFollowers.length / totalFollowers) : 0;

  // Report rate (reports in last 30 days)
  const recentReports = reportData.filter((r) => new Date(r.createdAt) >= thirtyDaysAgo);
  const reportRate = Math.min(1, recentReports.length / 5); // 5+ reports = max penalty

  // Plan participation (total plans joined)
  const planParticipation = Math.min(1, planCount / 5); // 5+ plans = max

  // Spam signals (based on SPAM reports against user)
  const spamSignals = Math.min(1, spamReports / 3);

  // Content hidden rate (private moments vs total moments)
  const totalMoments = momentCounts.length;
  const contentHiddenRate = totalMoments > 0 ? Math.min(1, hiddenContent / totalMoments) : 0;

  // Repetitive content rate (based on low engagement across many moments)
  const repetitiveContentRate = totalMoments > 3 && (!momentScores._avg.likes || momentScores._avg.likes < 1) ? 0.5 : 0;

  // Avg engagement rate (calculated from MomentScore aggregate data)
  const avgEngagementRate = momentScores._avg.likes && momentScores._avg.views
    ? Math.min(1, (momentScores._avg.likes + (momentScores._avg.comments || 0) * 2) / (momentScores._avg.views || 1))
    : 0.5;

  const factors: UserQualityFactors = {
    profileComplete,
    isVerified: user.isVerified,
    trustScore,
    reportRate,
    publishRegularity,
    avgEngagementRate,
    organicFollowersRate,
    planParticipation,
    spamSignals,
    contentHiddenRate,
    repetitiveContentRate,
  };

  const score = computeUserQualityScore(factors);

  // Upsert UserQualityScore
  await db.userQualityScore.upsert({
    where: { userId },
    create: {
      userId,
      score,
      trust: trustScore,
      activity: publishRegularity * 100,
      reportsPenalty: reportRate * 100,
      creatorBoost: organicFollowersRate * 50,
      lastCalculatedAt: now,
    },
    update: {
      score,
      trust: trustScore,
      activity: publishRegularity * 100,
      reportsPenalty: reportRate * 100,
      creatorBoost: organicFollowersRate * 50,
      lastCalculatedAt: now,
    },
  });

  return score;
}

export function computeUserQualityScore(factors: UserQualityFactors): number {
  let score = 50; // Base score

  // Positive factors
  if (factors.profileComplete) score += 10;
  if (factors.isVerified) score += 15;
  score += (factors.trustScore - 50) * 0.2; // Trust score influence
  score += factors.publishRegularity * 8;
  score += factors.avgEngagementRate * 10;
  score += factors.organicFollowersRate * 12;
  score += factors.planParticipation * 5;

  // Negative factors
  score -= factors.reportRate * 30;
  score -= factors.spamSignals * 40;
  score -= factors.contentHiddenRate * 15;
  score -= factors.repetitiveContentRate * 10;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

export async function getUserQualityScore(userId: string): Promise<number> {
  const cached = await db.userQualityScore.findUnique({
    where: { userId },
    select: { score: true, lastCalculatedAt: true },
  });

  // Recalculate if older than 24 hours or doesn't exist
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (!cached || !cached.lastCalculatedAt || cached.lastCalculatedAt < oneDayAgo) {
    return calculateUserQualityScore(userId);
  }

  return cached.score;
}
