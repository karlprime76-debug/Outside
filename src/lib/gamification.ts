import { db } from "@/lib/db";
import { getUserQualityScore } from "@/lib/algorithm/user-quality-score";

export interface LevelInfo {
  level: number;
  name: string;
  minScore: number;
  color: string;
  icon?: string;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, name: "Nouveau", minScore: 0, color: "slate" },
  { level: 2, name: "Explorateur", minScore: 10, color: "blue" },
  { level: 3, name: "Actif", minScore: 25, color: "emerald" },
  { level: 4, name: "Habitué", minScore: 40, color: "cyan" },
  { level: 5, name: "Influenceur", minScore: 55, color: "purple" },
  { level: 6, name: "Ambassadeur", minScore: 70, color: "pink" },
  { level: 7, name: "Star", minScore: 80, color: "amber" },
  { level: 8, name: "Elite", minScore: 90, color: "rose" },
  { level: 9, name: "Légende", minScore: 95, color: "indigo" },
  { level: 10, name: "Icône", minScore: 100, color: "orange" },
];

export function getLevelFromScore(score: number): LevelInfo {
  const sortedLevels = [...LEVELS].sort((a, b) => b.minScore - a.minScore);
  return sortedLevels.find((l) => score >= l.minScore) || LEVELS[0];
}

export async function getUserGamificationData(userId: string) {
  const score = await getUserQualityScore(userId);
  const currentLevel = getLevelFromScore(score);
  
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1);
  const progress = nextLevel 
    ? ((score - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100
    : 100;

  return {
    score,
    level: currentLevel,
    nextLevel,
    progress: Math.min(100, Math.max(0, progress)),
  };
}

export async function getGlobalLeaderboard(limit = 10) {
  const scores = await db.userQualityScore.findMany({
    orderBy: { score: "desc" },
    take: limit,
  });

  const userIds = scores.map((s) => s.userId);
  const users = userIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true, image: true, isVerified: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return scores.map((s, index) => ({
    rank: index + 1,
    score: s.score,
    user: userMap.get(s.userId) ?? { id: s.userId, name: null, username: null, image: null, isVerified: false },
    level: getLevelFromScore(s.score),
  }));
}

export async function getFriendsLeaderboard(userId: string, limit = 10) {
  const friendships = await db.friendship.findMany({
    where: {
      OR: [{ initiatorId: userId }, { receiverId: userId }],
    },
    select: {
      initiatorId: true,
      receiverId: true,
    },
  });

  const friendIds = friendships.map((f) => 
    f.initiatorId === userId ? f.receiverId : f.initiatorId
  );
  
  // Include self in friends leaderboard
  friendIds.push(userId);

  const scores = await db.userQualityScore.findMany({
    where: {
      userId: { in: friendIds },
    },
    orderBy: { score: "desc" },
    take: limit,
  });

  const userIds = scores.map((s) => s.userId);
  const users = userIds.length > 0
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true, image: true, isVerified: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return scores.map((s, index) => ({
    rank: index + 1,
    score: s.score,
    user: userMap.get(s.userId) ?? { id: s.userId, name: null, username: null, image: null, isVerified: false },
    level: getLevelFromScore(s.score),
  }));
}
