import { db } from "@/lib/db";
import { areFriends } from "@/lib/social/friendship";
import { PlanVisibility } from "@prisma/client";

export async function isFriend(userAId: string, userBId: string): Promise<boolean> {
  return areFriends(userAId, userBId);
}

export async function isFriendOfFriend(userAId: string, userBId: string): Promise<boolean> {
  if (await areFriends(userAId, userBId)) return true;

  const userAFriends = await db.friendship.findMany({
    where: { OR: [{ initiatorId: userAId }, { receiverId: userAId }] },
    select: { initiatorId: true, receiverId: true },
  });

  const friendIds = userAFriends.map((f) =>
    f.initiatorId === userAId ? f.receiverId : f.initiatorId
  );

  if (friendIds.length === 0) return false;

  const common = await db.friendship.count({
    where: {
      OR: friendIds.flatMap((fid) => [
        { initiatorId: fid, receiverId: userBId },
        { initiatorId: userBId, receiverId: fid },
      ]),
    },
  });

  return common > 0;
}

export async function canViewPlan(userId: string, planId: string): Promise<boolean> {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: { creatorId: true, visibility: true },
  });

  if (!plan) return false;
  if (plan.creatorId === userId) return true;

  switch (plan.visibility) {
    case PlanVisibility.PUBLIC:
      return true;
    case PlanVisibility.FRIENDS:
      return await isFriend(userId, plan.creatorId);
    case PlanVisibility.FRIENDS_OF_FRIENDS:
      return await isFriendOfFriend(userId, plan.creatorId);
    case PlanVisibility.INVITE_ONLY: {
      const invited = await db.planInvitation.count({
        where: { planId, receiverId: userId, status: { in: ["PENDING", "ACCEPTED"] } },
      });
      return invited > 0;
    }
    case PlanVisibility.PRIVATE:
      return false;
    default:
      return false;
  }
}

export async function canJoinPlan(userId: string, planId: string): Promise<boolean> {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: { creatorId: true, visibility: true, maxParticipants: true, status: true },
  });

  if (!plan || plan.status !== "ACTIVE") return false;
  if (plan.creatorId === userId) return true;

  const alreadyParticipant = await db.planParticipant.count({
    where: { planId, userId, status: { in: ["PENDING", "CONFIRMED"] } },
  });
  if (alreadyParticipant > 0) return false;

  switch (plan.visibility) {
    case PlanVisibility.PUBLIC:
      return true;
    case PlanVisibility.FRIENDS:
      return await isFriend(userId, plan.creatorId);
    case PlanVisibility.FRIENDS_OF_FRIENDS:
      return await isFriendOfFriend(userId, plan.creatorId);
    case PlanVisibility.INVITE_ONLY: {
      const invited = await db.planInvitation.count({
        where: { planId, receiverId: userId, status: "ACCEPTED" },
      });
      return invited > 0;
    }
    case PlanVisibility.PRIVATE:
      return false;
    default:
      return false;
  }
}

export async function canInviteToPlan(userId: string, planId: string): Promise<boolean> {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: { creatorId: true, visibility: true },
  });

  if (!plan) return false;
  if (plan.creatorId === userId) return true;

  const isParticipant = await db.planParticipant.count({
    where: { planId, userId, status: "CONFIRMED" },
  });

  return isParticipant > 0 && plan.visibility !== PlanVisibility.PRIVATE;
}
