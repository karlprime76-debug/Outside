import { db } from "@/lib/db";

const HOURS_24 = 24 * 60 * 60 * 1000;
const HOURS_48 = 48 * 60 * 60 * 1000;
const DAYS_7 = 7 * 24 * 60 * 60 * 1000;
const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

export function calculateFreshnessBoost(createdAt: Date): number {
  const age = Date.now() - createdAt.getTime();

  if (age < HOURS_24) {
    // First 24h: strong boost, decaying from 40 to 25
    return 40 - (age / HOURS_24) * 15;
  }
  if (age < HOURS_48) {
    // 24-48h: moderate boost from 25 to 15
    return 25 - ((age - HOURS_24) / HOURS_24) * 10;
  }
  if (age < DAYS_7) {
    // Week 1: small boost from 15 to 5
    return 15 - ((age - HOURS_48) / (DAYS_7 - HOURS_48)) * 10;
  }
  if (age < DAYS_30) {
    // Month 1: tiny boost from 5 to 0
    return 5 - ((age - DAYS_7) / (DAYS_30 - DAYS_7)) * 5;
  }
  // Older than 30 days: no freshness boost
  return 0;
}

export function calculateEngagementVelocity(
  impressions: number,
  views: number,
  completions: number,
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  profileOpens: number,
  followsGenerated: number
): number {
  if (impressions === 0) return 0;

  const completionRate = views > 0 ? completions / views : 0;
  const likeRate = views > 0 ? likes / views : 0;
  const commentRate = views > 0 ? comments / views : 0;
  const shareRate = views > 0 ? shares / views : 0;
  const saveRate = views > 0 ? saves / views : 0;
  const profileOpenRate = views > 0 ? profileOpens / views : 0;
  const followRate = views > 0 ? followsGenerated / views : 0;

  // Weighted formula
  return (
    completionRate * 35 +
    likeRate * 15 +
    commentRate * 20 +
    shareRate * 30 +
    saveRate * 20 +
    profileOpenRate * 15 +
    followRate * 25
  );
}

export function calculateQualityScore(
  completions: number,
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  reports: number,
  notInterestedCount: number
): number {
  const positiveSignals = completions * 3 + likes * 2 + comments * 2.5 + shares * 4 + saves * 3;
  const negativeSignals = reports * 10 + notInterestedCount * 5;

  return Math.max(0, positiveSignals - negativeSignals);
}

export function calculateSafetyPenalty(
  reports: number,
  notInterestedCount: number,
  impressions: number
): number {
  if (impressions === 0) return 1;

  const reportRate = reports / impressions;
  const notInterestedRate = notInterestedCount / impressions;

  // Base safety score starts at 1, can drop to near 0
  let penalty = 1;

  if (reportRate > 0.05) penalty -= 0.4;
  else if (reportRate > 0.02) penalty -= 0.2;
  else if (reportRate > 0.01) penalty -= 0.1;

  if (notInterestedRate > 0.3) penalty -= 0.3;
  else if (notInterestedRate > 0.15) penalty -= 0.15;

  return Math.max(0.01, penalty);
}

export async function calculateMomentScore(momentId: string): Promise<number> {
  const now = new Date();

  const [moment, eventCounts] = await Promise.all([
    db.moment.findUnique({
      where: { id: momentId },
      select: { id: true, createdAt: true, authorId: true },
    }),
    db.momentEvent.groupBy({
      by: ["type"],
      where: { momentId },
      _count: { type: true },
    }),
  ]);

  if (!moment) return 0;

  const counts: Record<string, number> = {};
  for (const row of eventCounts) {
    counts[row.type] = row._count.type;
  }

  const impressions = counts["IMPRESSION"] ?? 0;
  const views = counts["VIEW"] ?? 0;
  const completions = counts["COMPLETE_VIEW"] ?? 0;
  const likes = counts["LIKE"] ?? 0;
  const comments = counts["COMMENT"] ?? 0;
  const shares = counts["SHARE"] ?? 0;
  const saves = counts["SAVE"] ?? 0;
  const reports = counts["REPORT"] ?? 0;
  const profileOpens = counts["PROFILE_OPEN"] ?? 0;
  const followsGenerated = counts["FOLLOW_FROM_MOMENT"] ?? 0;
  const notInterestedCount = counts["NOT_INTERESTED"] ?? 0;

  const freshnessBoost = calculateFreshnessBoost(moment.createdAt);
  const engagementVelocity = calculateEngagementVelocity(
    impressions, views, completions, likes, comments, shares, saves, profileOpens, followsGenerated
  );
  const qualityScore = calculateQualityScore(
    completions, likes, comments, shares, saves, reports, notInterestedCount
  );
  const safetyScore = calculateSafetyPenalty(reports, notInterestedCount, impressions);

  // Base score
  const score = freshnessBoost + engagementVelocity + qualityScore * 0.1;

  // Apply safety penalty
  const finalScore = score * safetyScore;

  // Upsert MomentScore
  await db.momentScore.upsert({
    where: { momentId },
    create: {
      momentId,
      score: finalScore,
      viralScore: 0,
      qualityScore,
      safetyScore,
      impressions,
      views,
      completions,
      likes,
      comments,
      shares,
      saves,
      reports,
      profileOpens,
      followsGenerated,
      lastCalculatedAt: now,
    },
    update: {
      score: finalScore,
      qualityScore,
      safetyScore,
      impressions,
      views,
      completions,
      likes,
      comments,
      shares,
      saves,
      reports,
      profileOpens,
      followsGenerated,
      lastCalculatedAt: now,
    },
  });

  return finalScore;
}

export function getMomentRankingScore(
  moment: {
    id: string;
    createdAt: Date;
    authorId: string;
    city?: string | null;
    countryCode?: string | null;
  },
  viewer: {
    id: string;
    activeCity?: string | null;
    countryCode?: string | null;
    friendIds?: Set<string>;
    followingIds?: Set<string>;
    blockedIds?: Set<string>;
  },
  scoreData?: {
    score?: number;
    viralScore?: number;
    safetyScore?: number;
  } | null
): number {
  let rank = scoreData?.score ?? 0;

  // Safety filter: if safety score is very low, push to bottom
  if (scoreData?.safetyScore !== undefined && scoreData.safetyScore < 0.3) {
    rank -= 1000;
  }

  // City match boost
  if (viewer.activeCity && moment.city) {
    const viewerCity = viewer.activeCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const momentCity = moment.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (viewerCity === momentCity) {
      rank += 20;
    }
  }

  // Country match smaller boost
  if (viewer.countryCode && moment.countryCode) {
    if (viewer.countryCode === moment.countryCode) {
      rank += 5;
    }
  }

  // Social graph boost
  if (viewer.friendIds?.has(moment.authorId)) {
    rank += 15;
  }
  if (viewer.followingIds?.has(moment.authorId)) {
    rank += 10;
  }

  // Blocked penalty
  if (viewer.blockedIds?.has(moment.authorId)) {
    rank -= 10000;
  }

  return rank;
}

export async function getTopMoments(
  limit: number = 50,
  excludeIds: string[] = [],
  minScore: number = 0
) {
  return db.momentScore.findMany({
    where: {
      momentId: { notIn: excludeIds.length > 0 ? excludeIds : undefined },
      score: { gte: minScore },
      safetyScore: { gte: 0.3 },
    },
    orderBy: { score: "desc" },
    take: limit,
    select: {
      momentId: true,
      score: true,
      viralScore: true,
      qualityScore: true,
      safetyScore: true,
    },
  });
}
