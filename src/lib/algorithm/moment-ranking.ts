import { calculateFreshnessBoost } from "./moment-score";

export interface RankingFactors {
  freshnessBoost: number;
  completionRate: number;
  replayRate: number;
  dmShareRate: number;
  commentRate: number;
  saveRate: number;
  likeRate: number;
  profileOpenRate: number;
  followGeneratedRate: number;
  seeMoreLikeThisRate: number;
  cityMatchBoost: number;
  socialGraphBoost: number;
  creatorQualityBoost: number;
  newCreatorBoost: number;
  reportPenalty: number;
  notInterestedPenalty: number;
  quickSkipPenalty: number;
}

export interface RankingWeights {
  freshnessBoost: number;
  completionRate: number;
  replayRate: number;
  dmShareRate: number;
  commentRate: number;
  saveRate: number;
  likeRate: number;
  profileOpenRate: number;
  followGeneratedRate: number;
  seeMoreLikeThisRate: number;
  cityMatchBoost: number;
  socialGraphBoost: number;
  creatorQualityBoost: number;
  newCreatorBoost: number;
  reportPenalty: number;
  notInterestedPenalty: number;
  quickSkipPenalty: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  freshnessBoost: 1.2,
  completionRate: 35,
  replayRate: 20,
  dmShareRate: 40,
  commentRate: 25,
  saveRate: 20,
  likeRate: 12,
  profileOpenRate: 18,
  followGeneratedRate: 35,
  seeMoreLikeThisRate: 25,
  cityMatchBoost: 15,
  socialGraphBoost: 12,
  creatorQualityBoost: 20,
  newCreatorBoost: 10,
  reportPenalty: 60,
  notInterestedPenalty: 35,
  quickSkipPenalty: 20,
};

export function calculateMomentRankingScore(
  factors: RankingFactors,
  weights: RankingWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;

  // Positive factors
  score += factors.freshnessBoost * weights.freshnessBoost;
  score += factors.completionRate * weights.completionRate;
  score += factors.replayRate * weights.replayRate;
  score += factors.dmShareRate * weights.dmShareRate;
  score += factors.commentRate * weights.commentRate;
  score += factors.saveRate * weights.saveRate;
  score += factors.likeRate * weights.likeRate;
  score += factors.profileOpenRate * weights.profileOpenRate;
  score += factors.followGeneratedRate * weights.followGeneratedRate;
  score += factors.seeMoreLikeThisRate * weights.seeMoreLikeThisRate;
  score += factors.cityMatchBoost * weights.cityMatchBoost;
  score += factors.socialGraphBoost * weights.socialGraphBoost;
  score += factors.creatorQualityBoost * weights.creatorQualityBoost;
  score += factors.newCreatorBoost * weights.newCreatorBoost;

  // Negative factors (penalties)
  score -= factors.reportPenalty * weights.reportPenalty;
  score -= factors.notInterestedPenalty * weights.notInterestedPenalty;
  score -= factors.quickSkipPenalty * weights.quickSkipPenalty;

  return Math.max(0, score);
}

export function extractRankingFactors(
  momentScore: { views?: number; completions?: number; replays?: number; comments?: number; saves?: number; likes?: number; profileOpens?: number; followsGenerated?: number; reports?: number; quickSkipRate?: number; dmShares?: number; notInterested?: number; seeMoreLikeThis?: number },
  momentCreatedAt: Date,
  viewerCity: string | null,
  momentCity: string | null,
  isFriend: boolean,
  isFollowing: boolean,
  creatorQualityScore: number,
  isNewCreator: boolean
): RankingFactors {
  const views = momentScore.views || 0;
  const completions = momentScore.completions || 0;
  const replays = momentScore.replays || 0;
  const dmShares = momentScore.dmShares || 0;
  const comments = momentScore.comments || 0;
  const saves = momentScore.saves || 0;
  const likes = momentScore.likes || 0;
  const profileOpens = momentScore.profileOpens || 0;
  const followsGenerated = momentScore.followsGenerated || 0;
  const seeMoreLikeThis = momentScore.seeMoreLikeThis || 0;
  const reports = momentScore.reports || 0;
  const notInterested = momentScore.notInterested || 0;
  const quickSkipRate = momentScore.quickSkipRate || 0;

  const completionRate = views > 0 ? completions / views : 0;
  const replayRate = views > 0 ? replays / views : 0;
  const dmShareRate = views > 0 ? dmShares / views : 0;
  const commentRate = views > 0 ? comments / views : 0;
  const saveRate = views > 0 ? saves / views : 0;
  const likeRate = views > 0 ? likes / views : 0;
  const profileOpenRate = views > 0 ? profileOpens / views : 0;
  const followGeneratedRate = views > 0 ? followsGenerated / views : 0;
  const seeMoreLikeThisRate = views > 0 ? seeMoreLikeThis / views : 0;
  const reportRate = views > 0 ? reports / views : 0;
  const notInterestedRate = views > 0 ? notInterested / views : 0;

  const freshnessBoost = calculateFreshnessBoost(momentCreatedAt);

  // City match boost
  let cityMatchBoost = 0;
  if (viewerCity && momentCity) {
    const viewerCityNorm = viewerCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const momentCityNorm = momentCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (viewerCityNorm === momentCityNorm) {
      cityMatchBoost = 1;
    }
  }

  // Social graph boost
  let socialGraphBoost = 0;
  if (isFriend) socialGraphBoost = 1;
  else if (isFollowing) socialGraphBoost = 0.7;

  // Creator quality boost (normalized 0-1)
  const creatorQualityBoost = creatorQualityScore / 100;

  // New creator boost
  const newCreatorBoost = isNewCreator ? 1 : 0;

  return {
    freshnessBoost,
    completionRate,
    replayRate,
    dmShareRate,
    commentRate,
    saveRate,
    likeRate,
    profileOpenRate,
    followGeneratedRate,
    seeMoreLikeThisRate,
    cityMatchBoost,
    socialGraphBoost,
    creatorQualityBoost,
    newCreatorBoost,
    reportPenalty: reportRate,
    notInterestedPenalty: notInterestedRate,
    quickSkipPenalty: quickSkipRate,
  };
}

export function shouldExcludeFromViralBoost(momentScore: { reports?: number; views?: number }): boolean {
  const reports = momentScore.reports || 0;
  const views = momentScore.views || 0;
  const reportRate = views > 0 ? reports / views : 0;

  // Exclude if report rate is too high
  if (reportRate > 0.05) return true;
  if (reports >= 3) return true;

  return false;
}
