import { db } from "@/lib/db";

export async function notifyPlanReviewPending(planId: string): Promise<void> {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      title: true,
      participants: {
        where: { attendance: { not: "LEFT" } },
        select: { userId: true },
      },
    },
  });

  if (!plan) return;

  const participantIds = plan.participants.map((p) => p.userId);

  for (const userId of participantIds) {
    try {
      await db.notification.create({
        data: {
          type: "PLAN_REVIEW_PENDING",
          title: "Plan terminé — donne ton avis",
          body: `Le plan "${plan.title}" est terminé. Évalue les participants pour renforcer la confiance.`,
          recipientId: userId,
          data: JSON.stringify({ planId }),
        },
      });
    } catch {
      // Skip failures per-user
    }
  }
}

export async function notifyPlanConfirmed(planId: string): Promise<void> {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      title: true,
      creatorId: true,
      participants: {
        where: { attendance: { not: "LEFT" } },
        select: { userId: true },
      },
    },
  });

  if (!plan) return;

  const notifyIds = [plan.creatorId, ...plan.participants.map((p) => p.userId)];
  const uniqueIds = [...new Set(notifyIds)];

  for (const userId of uniqueIds) {
    try {
      await db.notification.create({
        data: {
          type: "PLAN_CONFIRMED",
          title: "Plan confirmé par la communauté",
          body: `Le plan "${plan.title}" a été confirmé comme réel par les participants.`,
          recipientId: userId,
          data: JSON.stringify({ planId }),
        },
      });
    } catch {
      // Skip
    }
  }
}
