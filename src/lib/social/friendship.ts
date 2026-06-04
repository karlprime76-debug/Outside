import { db } from "@/lib/db";
import { MAX_FRIENDS } from "./constants";

export type RelationshipStatus =
  | "SELF"
  | "NONE"
  | "FRIENDS"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "FOLLOWING"
  | "BLOCKED";

export function normalizeFriendshipPair(userId1: string, userId2: string) {
  if (userId1 < userId2) {
    return { userAId: userId1, userBId: userId2 };
  }
  return { userAId: userId2, userBId: userId1 };
}

export async function getFriendCount(userId: string): Promise<number> {
  const count = await db.friendship.count({
    where: {
      OR: [{ initiatorId: userId }, { receiverId: userId }],
    },
  });
  return count;
}

export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const count = await db.friendship.count({
    where: {
      OR: [
        { initiatorId: userId1, receiverId: userId2 },
        { initiatorId: userId2, receiverId: userId1 },
      ],
    },
  });
  return count > 0;
}

export async function hasPendingFriendRequest(
  senderId: string,
  receiverId: string
): Promise<boolean> {
  const count = await db.friendRequest.count({
    where: {
      OR: [
        { senderId, receiverId, status: "PENDING" },
        { senderId: receiverId, receiverId: senderId, status: "PENDING" },
      ],
    },
  });
  return count > 0;
}

export async function canReceiveMoreFriends(userId: string): Promise<boolean> {
  const count = await getFriendCount(userId);
  return count < MAX_FRIENDS;
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const count = await db.userBlock.count({
    where: {
      OR: [
        { blockerId, blockedId },
        { blockerId: blockedId, blockedId: blockerId },
      ],
    },
  });
  return count > 0;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const count = await db.follow.count({
    where: { followerId, followingId },
  });
  return count > 0;
}

export async function getRelationshipStatus(
  currentUserId: string,
  targetUserId: string
): Promise<RelationshipStatus> {
  if (currentUserId === targetUserId) return "SELF";

  if (await isBlocked(currentUserId, targetUserId)) return "BLOCKED";

  if (await areFriends(currentUserId, targetUserId)) return "FRIENDS";

  const sentRequest = await db.friendRequest.findFirst({
    where: { senderId: currentUserId, receiverId: targetUserId, status: "PENDING" },
  });
  if (sentRequest) return "REQUEST_SENT";

  const receivedRequest = await db.friendRequest.findFirst({
    where: { senderId: targetUserId, receiverId: currentUserId, status: "PENDING" },
  });
  if (receivedRequest) return "REQUEST_RECEIVED";

  if (await isFollowing(currentUserId, targetUserId)) return "FOLLOWING";

  return "NONE";
}

export async function getRelationshipStatuses(
  currentUserId: string,
  targetUserIds: string[]
): Promise<Map<string, RelationshipStatus>> {
  const result = new Map<string, RelationshipStatus>();
  if (targetUserIds.length === 0) return result;

  const ids = targetUserIds.filter((id) => id !== currentUserId);
  ids.forEach((id) => result.set(id, "NONE"));

  const [
    friendships,
    blocks,
    sentRequests,
    receivedRequests,
    follows,
  ] = await Promise.all([
    db.friendship.findMany({
      where: {
        OR: ids.flatMap((id) => [
          { initiatorId: currentUserId, receiverId: id },
          { initiatorId: id, receiverId: currentUserId },
        ]),
      },
      select: { initiatorId: true, receiverId: true },
    }),
    db.userBlock.findMany({
      where: {
        OR: ids.flatMap((id) => [
          { blockerId: currentUserId, blockedId: id },
          { blockerId: id, blockedId: currentUserId },
        ]),
      },
      select: { blockerId: true, blockedId: true },
    }),
    db.friendRequest.findMany({
      where: { senderId: currentUserId, receiverId: { in: ids }, status: "PENDING" },
      select: { receiverId: true },
    }),
    db.friendRequest.findMany({
      where: { senderId: { in: ids }, receiverId: currentUserId, status: "PENDING" },
      select: { senderId: true },
    }),
    db.follow.findMany({
      where: { followerId: currentUserId, followingId: { in: ids } },
      select: { followingId: true },
    }),
  ]);

  const friendSet = new Set(
    friendships.map((f) => (f.initiatorId === currentUserId ? f.receiverId : f.initiatorId))
  );
  const blockedSet = new Set(
    blocks.flatMap((b) => (b.blockerId === currentUserId ? [b.blockedId] : [b.blockerId]))
  );
  const sentSet = new Set(sentRequests.map((r) => r.receiverId));
  const receivedSet = new Set(receivedRequests.map((r) => r.senderId));
  const followSet = new Set(follows.map((f) => f.followingId));

  for (const id of ids) {
    if (blockedSet.has(id)) {
      result.set(id, "BLOCKED");
    } else if (friendSet.has(id)) {
      result.set(id, "FRIENDS");
    } else if (sentSet.has(id)) {
      result.set(id, "REQUEST_SENT");
    } else if (receivedSet.has(id)) {
      result.set(id, "REQUEST_RECEIVED");
    } else if (followSet.has(id)) {
      result.set(id, "FOLLOWING");
    }
  }

  return result;
}
