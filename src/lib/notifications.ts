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
}

const typeToPushCategory: Record<NotificationType, Parameters<typeof sendPushToUser>[1]> = {
  FRIEND_REQUEST: "friend",
  FRIEND_ACCEPTED: "friend",
  FOLLOW: "friend",
  PLAN_INVITE: "plan",
  PLAN_REMINDER: "plan",
  LIVE_STARTED: "live",
  PRO_EVENT: "pro",
  PRO_APPROVED: "pro",
  BADGE_EARNED: "system",
  SYSTEM: "system",
  DM_MESSAGE: "dm",
  MOMENT_LIKE: "moment",
  MOMENT_COMMENT: "moment",
};

export async function createNotification(input: CreateNotificationInput) {
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
        : input.type === "PLAN_INVITE"
        ? `/plans/${input.data?.planId || ""}`
        : input.type === "MOMENT_LIKE" || input.type === "MOMENT_COMMENT"
        ? `/moments`
        : "/notifications";

    sendPushToUser(input.recipientId, pushCategory, {
      title: input.title,
      body: input.body || "",
      url,
      tag: notification.id,
    }).catch(() => {});
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
