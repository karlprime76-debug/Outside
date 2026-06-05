import { db } from "@/lib/db";

/**
 * Create automatic reminders for a plan participant.
 * - 24h before if possible
 * - 1h before
 * - 15min before (optional, not created if plan starts in < 30min)
 */
export async function createPlanReminders(userId: string, planId: string, startDate: Date) {
  const now = new Date();
  const reminders: { userId: string; planId: string; remindAt: Date }[] = [];

  const oneDayBefore = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
  if (oneDayBefore > now) {
    reminders.push({ userId, planId, remindAt: oneDayBefore });
  }

  const oneHourBefore = new Date(startDate.getTime() - 60 * 60 * 1000);
  if (oneHourBefore > now) {
    reminders.push({ userId, planId, remindAt: oneHourBefore });
  }

  const fifteenMinBefore = new Date(startDate.getTime() - 15 * 60 * 1000);
  if (fifteenMinBefore > now) {
    reminders.push({ userId, planId, remindAt: fifteenMinBefore });
  }

  if (reminders.length === 0) return;

  // Delete existing unsent reminders for this user+plan to avoid duplicates
  await db.planReminder.deleteMany({
    where: { userId, planId, sentAt: null },
  });

  await db.planReminder.createMany({
    data: reminders,
    skipDuplicates: true,
  });
}

/**
 * Remove all unsent reminders for a user on a plan (e.g. when they leave).
 */
export async function removePlanReminders(userId: string, planId: string) {
  await db.planReminder.deleteMany({
    where: { userId, planId, sentAt: null },
  });
}
