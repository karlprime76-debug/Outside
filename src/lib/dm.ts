import { db } from "@/lib/db";

export async function getOrCreateDirectConversation(userAId: string, userBId: string) {
  if (userAId === userBId) return null;

  // Find existing conversation with these participants
  const existing = await db.conversation.findFirst({
    where: {
      participants: {
        some: { userId: userAId },
      },
      AND: [
        {
          participants: { some: { userId: userBId } },
        },
      ],
    },
  });
  if (existing) return existing;

  const conv = await db.conversation.create({
    data: {
      participants: {
        createMany: {
          data: [{ userId: userAId }, { userId: userBId }],
        },
      },
    },
  });
  return conv;
}

export async function canSendDirectMessage(senderId: string, receiverId: string) {
  if (senderId === receiverId) return false;

  const blocked = await db.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: senderId, blockedId: receiverId },
        { blockerId: receiverId, blockedId: senderId },
      ],
    },
  });
  if (blocked) return false;

  const friendship = await db.friendship.findFirst({
    where: {
      OR: [
        { initiatorId: senderId, receiverId: receiverId },
        { initiatorId: receiverId, receiverId: senderId },
      ],
    },
  });
  if (friendship) return true;

  const settings = await db.userSettings.findUnique({ where: { userId: receiverId } });
  const perm = (settings?.directMessagePermission as string) || "FRIENDS_ONLY";

  if (perm === "EVERYONE") return true;
  if (perm === "FRIENDS_ONLY") return false;

  const follows = await db.follow.findFirst({ where: { followerId: senderId, followingId: receiverId } });
  return !!follows;
}

export async function getConversationForUser(conversationId: string, userId: string) {
  const participant = await db.conversationParticipant.findFirst({
    where: { conversationId, userId },
    include: { conversation: true },
  });
  return participant;
}

export async function markConversationRead(conversationId: string, userId: string) {
  await db.conversationParticipant.updateMany({
    where: { conversationId, userId },
    data: { lastReadAt: new Date() },
  });
}

export async function getUnreadDmCount(userId: string) {
  const parts = await db.conversationParticipant.findMany({ where: { userId }, select: { conversationId: true, lastReadAt: true } });
  if (parts.length === 0) return 0;
  const counts = await Promise.all(
    parts.map(async (p) => {
      const c = await db.directMessage.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          isDeleted: false,
          createdAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
        },
      });
      return c;
    })
  );
  return counts.reduce((a, b) => a + b, 0);
}
