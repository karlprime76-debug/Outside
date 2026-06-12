import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { sendPushToUser } from "@/lib/push";

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  recipientId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorImage?: string | null;
  data?: Record<string, unknown>;
  skipSettingsCheck?: boolean; // For system notifications
}

const notificationTypeToPref: Record<string, string | null> = {
  FRIEND_REQUEST: "notificationFriendRequests",
  FRIEND_ACCEPTED: "notificationFriendRequests",
  FOLLOW: "notificationFriendRequests",
  PLAN_INVITE: "notificationPlanInvites",
  PLAN_REMINDER: "notificationPlanReminders",
  MOMENT_LIKE: "notificationMoments",
  MOMENT_COMMENT: "notificationMoments",
  DM_MESSAGE: "pushDm",
  PLAN_GROUP_MESSAGE: "pushDm",
  DROP_AVAILABLE: null, // System notification
  MISSION_AVAILABLE: null, // System notification
  // System/admin notifications
  LIVE_STARTED: "notificationLiveStarted",
  PRO_EVENT: "notificationProEvents",
  PRO_APPROVED: "notificationProEvents",
  BADGE_EARNED: null,
  SYSTEM: null,
  WEEKLY_RECAP_READY: null,
  AMBASSADOR_TO_DISCOVER: "notificationFriendRequests",
  NEW_PLAN: "notificationPlans",
  PLAN_JOINED: "notificationPlans",
  CHALLENGE_COMPLETED: null,
};

async function shouldSendNotification(userId: string, notificationType: NotificationType, skipSettingsCheck?: boolean): Promise<boolean> {
  if (skipSettingsCheck) return true;
  
  const prefKey = notificationTypeToPref[notificationType];
  if (!prefKey) return true; // System notifications always send
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      userSettings: true,
    },
  });
  
  if (!user) return false;
  
  const settings = user.userSettings as Record<string, boolean> | null;
  if (!settings) return true; // Default to send if settings don't exist
  
  return settings[prefKey] !== false;
}

const typeToPushCategory: Record<NotificationType, Parameters<typeof sendPushToUser>[1]> = {
  FRIEND_REQUEST: "friend",
  FRIEND_ACCEPTED: "friend",
  FOLLOW: "friend",
  PLAN_INVITE: "plan",
  PLAN_REMINDER: "plan-reminder",
  LIVE_STARTED: "live",
  PRO_EVENT: "pro",
  PRO_APPROVED: "pro",
  BADGE_EARNED: "system",
  SYSTEM: "system",
  DM_MESSAGE: "dm",
  MOMENT_LIKE: "moment",
  MOMENT_COMMENT: "moment",
  DROP_AVAILABLE: "system",
  MISSION_AVAILABLE: "system",
  PLAN_GROUP_MESSAGE: "dm",
  WEEKLY_RECAP_READY: "system",
  AMBASSADOR_TO_DISCOVER: "friend",
  PLAN_REVIEW_PENDING: "plan",
  PLAN_CONFIRMED: "plan",
  NEW_PLAN: "plan",
  CHALLENGE_COMPLETED: "system",
  PLAN_JOINED: "plan",
};

export async function createNotification(input: CreateNotificationInput) {
  // Check user settings before creating notification
  const canSendNotification = await shouldSendNotification(input.recipientId, input.type, input.skipSettingsCheck);
  
  if (!canSendNotification) {
    // Don't create a database entry for suppressed notifications
    return;
  }

  const notification = await db.notification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body,
      recipientId: input.recipientId,
      actorId: input.actorId || undefined,
      actorName: input.actorName || undefined,
      actorImage: input.actorImage || undefined,
      data: input.data ? JSON.stringify(input.data) : undefined,
    },
  });

  const pushCategory = typeToPushCategory[input.type];
  if (pushCategory) {
    const url =
      typeof input.data?.url === "string"
        ? input.data.url
        : input.type === "DM_MESSAGE"
        ? `/dm/${input.data?.conversationId || ""}`
        : input.type === "PLAN_INVITE" || input.type === "PLAN_REMINDER" || input.type === "PLAN_JOINED" || input.type === "PLAN_REVIEW_PENDING" || input.type === "PLAN_CONFIRMED"
        ? `/plans/${input.data?.planId || ""}`
        : input.type === "MOMENT_LIKE" || input.type === "MOMENT_COMMENT"
        ? `/moments`
        : input.type === "FOLLOW"
        ? `/u/${input.data?.username || input.data?.actorName || ""}`
        : input.type === "LIVE_STARTED"
        ? `/live/${input.data?.liveId || ""}`
        : input.type === "FRIEND_REQUEST" || input.type === "FRIEND_ACCEPTED"
        ? "/friends"
        : input.type === "PRO_APPROVED"
        ? "/pro/dashboard"
        : input.type === "DROP_AVAILABLE"
        ? `/drops/${input.data?.dropId || ""}`
        : input.type === "BADGE_EARNED" || input.type === "CHALLENGE_COMPLETED"
        ? "/profile"
        : "/activity";

    sendPushToUser(input.recipientId, pushCategory, {
      title: input.title,
      body: input.body || "",
      url,
      tag: notification.id,
    }).catch((err) => { console.error("[PUSH_ERROR] Failed to send push notification:", err); });
  }

  return notification;
}

export async function markNotificationsAsRead(userId: string, ids?: string[]) {
  const where = ids?.length
    ? { recipientId: userId, id: { in: ids } }
    : { recipientId: userId, isRead: false };

  return db.notification.updateMany({
    where,
    data: { isRead: true, readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { recipientId: userId, isRead: false },
  });
}
