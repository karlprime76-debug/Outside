import { MomentScore } from "@prisma/client";

export enum AudienceLevel {
  TEST_INITIAL = 0,
  PROMISING_LOCAL = 1,
  VIRAL_CITY = 2,
  COUNTRY = 3,
  GLOBAL = 4,
}

export interface AudienceLevelConfig {
  level: AudienceLevel;
  name: string;
  description: string;
  minViews: number;
  minCompletionRate: number;
  minLikeRate: number;
  minDmShareRate: number;
  maxReportRate: number;
  maxNotInterestedRate: number;
}

const AUDIENCE_LEVEL_CONFIGS: Record<AudienceLevel, AudienceLevelConfig> = {
  [AudienceLevel.TEST_INITIAL]: {
    level: AudienceLevel.TEST_INITIAL,
    name: "Test initial",
    description: "Amis, abonnés, petite audience ville",
    minViews: 0,
    minCompletionRate: 0,
    minLikeRate: 0,
    minDmShareRate: 0,
    maxReportRate: 1.0,
    maxNotInterestedRate: 1.0,
  },
  [AudienceLevel.PROMISING_LOCAL]: {
    level: AudienceLevel.PROMISING_LOCAL,
    name: "Prometteur local",
    description: "Plus d'utilisateurs dans la ville",
    minViews: 20,
    minCompletionRate: 0.3,
    minLikeRate: 0.05,
    minDmShareRate: 0,
    maxReportRate: 0.1,
    maxNotInterestedRate: 0.3,
  },
  [AudienceLevel.VIRAL_CITY]: {
    level: AudienceLevel.VIRAL_CITY,
    name: "Viral ville",
    description: "Large diffusion dans la ville",
    minViews: 50,
    minCompletionRate: 0.4,
    minLikeRate: 0.08,
    minDmShareRate: 0.02,
    maxReportRate: 0.05,
    maxNotInterestedRate: 0.2,
  },
  [AudienceLevel.COUNTRY]: {
    level: AudienceLevel.COUNTRY,
    name: "Pays",
    description: "Diffusion dans le pays",
    minViews: 100,
    minCompletionRate: 0.5,
    minLikeRate: 0.1,
    minDmShareRate: 0.03,
    maxReportRate: 0.03,
    maxNotInterestedRate: 0.15,
  },
  [AudienceLevel.GLOBAL]: {
    level: AudienceLevel.GLOBAL,
    name: "Global",
    description: "Diffusion internationale",
    minViews: 500,
    minCompletionRate: 0.6,
    minLikeRate: 0.15,
    minDmShareRate: 0.05,
    maxReportRate: 0.02,
    maxNotInterestedRate: 0.1,
  },
};

export function getAudienceLevel(momentScore: MomentScore | null): AudienceLevel {
  if (!momentScore) return AudienceLevel.TEST_INITIAL;

  const views = momentScore.views || 0;
  const completions = momentScore.completions || 0;
  const likes = momentScore.likes || 0;
  const dmShares = (momentScore as { dmShares?: number }).dmShares || 0;
  const reports = momentScore.reports || 0;
  const notInterested = (momentScore as { notInterested?: number }).notInterested || 0;

  const completionRate = views > 0 ? completions / views : 0;
  const likeRate = views > 0 ? likes / views : 0;
  const dmShareRate = views > 0 ? dmShares / views : 0;
  const reportRate = views > 0 ? reports / views : 0;
  const notInterestedRate = views > 0 ? notInterested / views : 0;

  // Check each level from highest to lowest
  for (let level = AudienceLevel.GLOBAL; level >= AudienceLevel.TEST_INITIAL; level--) {
    const config = AUDIENCE_LEVEL_CONFIGS[level];
    if (
      views >= config.minViews &&
      completionRate >= config.minCompletionRate &&
      likeRate >= config.minLikeRate &&
      dmShareRate >= config.minDmShareRate &&
      reportRate <= config.maxReportRate &&
      notInterestedRate <= config.maxNotInterestedRate
    ) {
      return level;
    }
  }

  return AudienceLevel.TEST_INITIAL;
}

export function shouldPromoteToNextLevel(momentScore: MomentScore): boolean {
  const currentLevel = getAudienceLevel(momentScore);
  const nextLevel = currentLevel + 1;

  if (nextLevel > AudienceLevel.GLOBAL) return false;

  const nextConfig = AUDIENCE_LEVEL_CONFIGS[nextLevel as AudienceLevel];

  const views = momentScore.views || 0;
  const completions = momentScore.completions || 0;
  const likes = momentScore.likes || 0;
  const dmShares = (momentScore as { dmShares?: number }).dmShares || 0;
  const reports = momentScore.reports || 0;
  const notInterested = (momentScore as { notInterested?: number }).notInterested || 0;

  const completionRate = views > 0 ? completions / views : 0;
  const likeRate = views > 0 ? likes / views : 0;
  const dmShareRate = views > 0 ? dmShares / views : 0;
  const reportRate = views > 0 ? reports / views : 0;
  const notInterestedRate = views > 0 ? notInterested / views : 0;

  return (
    views >= nextConfig.minViews &&
    completionRate >= nextConfig.minCompletionRate &&
    likeRate >= nextConfig.minLikeRate &&
    dmShareRate >= nextConfig.minDmShareRate &&
    reportRate <= nextConfig.maxReportRate &&
    notInterestedRate <= nextConfig.maxNotInterestedRate
  );
}

export function getAudienceScopeForLevel(level: AudienceLevel): string {
  const config = AUDIENCE_LEVEL_CONFIGS[level];
  return config.description;
}

export function getMaxAudienceLevelForUser(userRole: string, userTrustScore: number): number {
  // Admins and moderators can see all levels
  if (userRole === "ADMIN" || userRole === "MODERATOR") return AudienceLevel.GLOBAL;

  // High trust users can see up to country level
  if (userTrustScore >= 80) return AudienceLevel.COUNTRY;

  // Regular users can see up to viral city level
  if (userTrustScore >= 50) return AudienceLevel.VIRAL_CITY;

  // Low trust users limited to promising local
  return AudienceLevel.PROMISING_LOCAL;
}

export function getAudienceLevelName(level: AudienceLevel): string {
  return AUDIENCE_LEVEL_CONFIGS[level].name;
}
