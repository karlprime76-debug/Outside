/**
 * Système anti-spam pour les hashtags OUTSIDE
 * Protection contre l'abus de hashtags
 */

import { db } from "@/lib/db";

const MAX_HASHTAGS = 10;
const MAX_HASHTAG_LENGTH = 30;
const SPAM_THRESHOLD = 0.7; // 70% of content being spam triggers penalties

interface SpamDetectionResult {
  isSpam: boolean;
  penaltyScore: number;
  reasons: string[];
}

/**
 * Détecte si un contenu utilise des hashtags de manière spammy
 */
export function detectHashtagSpam(
  content: string,
  hashtags: string[]
): SpamDetectionResult {
  const reasons: string[] = [];
  let penaltyScore = 0;

  // Trop de hashtags
  if (hashtags.length > MAX_HASHTAGS) {
    reasons.push(`Trop de hashtags (${hashtags.length}/${MAX_HASHTAGS})`);
    penaltyScore += 20;
  }

  // Hashtags trop longs
  const tooLong = hashtags.filter(h => h.length > MAX_HASHTAG_LENGTH);
  if (tooLong.length > 0) {
    reasons.push(`Hashtags trop longs (${tooLong.length})`);
    penaltyScore += 10 * tooLong.length;
  }

  // Hashtags répétés dans le même contenu
  const uniqueHashtags = new Set(hashtags.map(h => h.toLowerCase()));
  if (uniqueHashtags.size < hashtags.length) {
    reasons.push(`Hashtags répétés (${hashtags.length - uniqueHashtags.size})`);
    penaltyScore += 15;
  }

  // Ratio hashtags / contenu (si beaucoup de hashtags par rapport au contenu)
  const contentLength = content.trim().length;
  const hashtagsLength = hashtags.join('').length;
  if (contentLength > 0 && hashtagsLength > contentLength * 0.5) {
    reasons.push("Ratio hashtags/contenu trop élevé");
    penaltyScore += 25;
  }

  // Hashtags populaires sans contenu pertinent (simulé par la longueur du contenu)
  if (hashtags.length >= 5 && contentLength < 50) {
    reasons.push("Hashtags nombreux avec peu de contenu");
    penaltyScore += 30;
  }

  const isSpam = penaltyScore >= 50;

  return {
    isSpam,
    penaltyScore,
    reasons,
  };
}

/**
 * Calcule la pénalité de spam pour un Moment ou Plan
 */
export async function calculateHashtagSpamPenalty(
  momentOrPlan: { id: string; type: 'moment' | 'plan' }
): Promise<number> {
  let penaltyScore = 0;

  // Vérifier si le contenu est signalé
  const reportCount = momentOrPlan.type === 'moment'
    ? await db.report.count({
        where: {
          targetType: "moment",
          targetId: momentOrPlan.id,
          status: { in: ['PENDING', 'OPEN', 'REVIEWING'] },
        },
      })
    : await db.report.count({
        where: {
          planId: momentOrPlan.id,
          status: { in: ['PENDING', 'OPEN', 'REVIEWING'] },
        },
      });

  if (reportCount > 0) {
    penaltyScore += reportCount * 10;
  }

  // Vérifier si l'auteur a un historique de spam
  const userId = momentOrPlan.type === 'moment'
    ? (await db.moment.findUnique({ where: { id: momentOrPlan.id }, select: { authorId: true } }))?.authorId
    : (await db.plan.findUnique({ where: { id: momentOrPlan.id }, select: { creatorId: true } }))?.creatorId;

  if (userId) {
    const userReportCount = await db.report.count({
      where: {
        reportedUserId: userId,
        status: { in: ['REVIEWED', 'RESOLVED'] },
        reason: { in: ['SPAM', 'INAPPROPRIATE_CONTENT'] },
      },
    });

    penaltyScore += userReportCount * 5;
  }

  return Math.min(penaltyScore, 100); // Cap at 100
}

/**
 * Détermine si un hashtag doit être ignoré pour le ranking
 */
export function shouldIgnoreHashtagForRanking(
  hashtag: { isBlocked: boolean; isOfficial: boolean; usageCount: number },
  contentSpamScore: number
): boolean {
  // Ignorer les hashtags bloqués
  if (hashtag.isBlocked) {
    return true;
  }

  // Ignorer les hashtags si le contenu est spammy
  if (contentSpamScore > SPAM_THRESHOLD * 100) {
    return true;
  }

  // Ne jamais ignorer les hashtags officiels (sauf si bloqués)
  if (hashtag.isOfficial) {
    return false;
  }

  return false;
}

/**
 * Applique une pénalité de ranking basée sur le spam de hashtags
 */
export function applyHashtagSpamPenalty(
  baseScore: number,
  spamScore: number
): number {
  if (spamScore <= 0) return baseScore;

  // Réduction progressive du score
  const penaltyFactor = spamScore / 100;
  const reducedScore = baseScore * (1 - penaltyFactor);

  return Math.max(0, reducedScore);
}

/**
 * Vérifie si un utilisateur est un spammeur de hashtags
 */
export async function isHashtagSpammer(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      reportsReceived: {
        where: { reason: 'SPAM' },
        take: 5,
      },
    },
  });

  if (!user) return false;

  // Si l'utilisateur a plus de 3 signalements pour spam
  return user.reportsReceived.length >= 3;
}
