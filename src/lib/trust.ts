import { cache } from "react";
import { db } from "@/lib/db";

export type TrustBadge = "new" | "active" | "reliable" | "very_reliable";

export interface TrustSignals {
  hasPhoto: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  accountAgeDays: number;
  plansCreated: number;
  plansJoined: number;
  plansConfirmed: number;
  positiveReviews: number;
  reportsCount: number;
}

export interface TrustData {
  trustScore: number;
  badge: TrustBadge;
  badgeLabel: string;
  signals: TrustSignals;
}

export function getTrustBadge(score: number, isVerified?: boolean): { badge: TrustBadge; label: string } {
  if (isVerified) return { badge: "very_reliable", label: "Vérifié" };
  if (score >= 86) return { badge: "very_reliable", label: "Très fiable" };
  if (score >= 61) return { badge: "reliable", label: "Fiable" };
  if (score >= 31) return { badge: "active", label: "Profil actif" };
  return { badge: "new", label: "Nouveau" };
}

export const getTrustSignals = cache(async (userId: string): Promise<TrustSignals> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      image: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
    },
  });

  const plansCreated = await db.plan.count({ where: { creatorId: userId } });

  const plansConfirmed = await db.planParticipant.count({
    where: { userId, status: "CONFIRMED" },
  });

  const positiveReviews = await db.trustReview.count({
    where: { reviewedId: userId, wasPresent: true, respectful: true },
  });

  const reportsCount = await db.report.count({
    where: { reportedUserId: userId, status: { in: ["RESOLVED", "REVIEWING"] } },
  });

  const accountAgeDays = user ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return {
    hasPhoto: !!user?.image,
    emailVerified: !!user?.emailVerified,
    phoneVerified: !!user?.phoneVerified,
    accountAgeDays,
    plansCreated,
    plansJoined: plansConfirmed,
    plansConfirmed,
    positiveReviews,
    reportsCount,
  };
});

export async function calculateTrustScore(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isVerified: true },
  });
  const signals = await getTrustSignals(userId);

  let score = 0;

  if (user?.isVerified) score += 20;
  if (signals.hasPhoto) score += 10;
  if (signals.emailVerified) score += 10;
  if (signals.phoneVerified) score += 10;
  if (signals.accountAgeDays > 30) score += 10;

  score += Math.min(signals.plansConfirmed * 5, 50);
  score += Math.min(signals.positiveReviews * 5, 50);

  score -= signals.reportsCount * 20;

  return Math.max(0, Math.min(100, score));
}

export async function recalculateAndUpdateTrustScore(userId: string): Promise<void> {
  const score = await calculateTrustScore(userId);
  await db.user.update({
    where: { id: userId },
    data: { trustScore: score },
  });
}

export async function canReviewUser(
  reviewerId: string,
  reviewedId: string,
  planId?: string | null
): Promise<{ ok: boolean; reason?: string }> {
  if (reviewerId === reviewedId) {
    return { ok: false, reason: "Tu ne peux pas te reviewer toi-même." };
  }

  const existing = await db.trustReview.findUnique({
    where: {
      reviewerId_reviewedId_planId: {
        reviewerId,
        reviewedId,
        planId: (planId ?? null) as string,
      },
    },
  });

  if (existing) {
    return { ok: false, reason: "Tu as déjà laissé un retour pour cette personne." };
  }

  return { ok: true };
}

export const getTrustData = cache(async (userId: string): Promise<TrustData> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { trustScore: true, isVerified: true },
  });

  const score = (user as unknown as { trustScore?: number })?.trustScore ?? 0;
  const isVerified = (user as unknown as { isVerified?: boolean })?.isVerified ?? false;
  const { badge, label } = getTrustBadge(score, isVerified);
  const signals = await getTrustSignals(userId);

  return {
    trustScore: score,
    badge,
    badgeLabel: label,
    signals,
  };
});
