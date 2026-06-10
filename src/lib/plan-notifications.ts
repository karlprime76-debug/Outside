import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

/**
 * Send review pending notifications to all participants when a plan is completed
 */
export async function sendPlanReviewNotifications(planId: string, planTitle: string) {
  const participants = await db.planParticipant.findMany({
    where: { planId },
    include: { user: { select: { id: true, name: true } } },
  });

  for (const participant of participants) {
    await createNotification({
      type: "PLAN_REVIEW_PENDING",
      title: "Plan terminé",
      body: `Le plan "${planTitle}" est terminé. Partage ton expérience !`,
      recipientId: participant.user.id,
      data: { planId, url: `/plans/${planId}` },
    }).catch((err) => { console.error("[NOTIFICATION_ERROR] Failed to send review pending notification:", err); });
  }
}

/**
 * Send plan confirmed notification when a plan reaches community confirmation
 */
export async function sendPlanConfirmedNotification(planId: string, planTitle: string, creatorId: string) {
  await createNotification({
    type: "PLAN_CONFIRMED",
    title: "Plan confirmé !",
    body: `Ton plan "${planTitle}" a été confirmé par la communauté.`,
    recipientId: creatorId,
    data: { planId, url: `/plans/${planId}` },
  }).catch((err) => { console.error("[NOTIFICATION_ERROR] Failed to send plan confirmed notification:", err); });
}
