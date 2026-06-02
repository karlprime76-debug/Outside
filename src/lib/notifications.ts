import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

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

export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
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
