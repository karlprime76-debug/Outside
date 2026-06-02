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
