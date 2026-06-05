import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { isBlocked } from "@/lib/social/friendship";
import { logError } from "@/lib/log";

interface NotifyResult {
  internalSent: number;
  pushSent: number;
  skipped: number;
  recipientsCount: number;
}

export async function notifyLiveStarted(liveId: string): Promise<NotifyResult> {
  const result: NotifyResult = {
    internalSent: 0,
    pushSent: 0,
    skipped: 0,
    recipientsCount: 0,
  };

  try {
    const live = await db.liveSession.findUnique({
      where: { id: liveId },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
    });

    if (!live) {
      logError("[LIVE_ERROR]", "Live not found for notification", { liveId });
      return result;
    }

    if (live.status !== "LIVE") {
      return result;
    }

    const hostId = live.hostId;

    // A. Followers
    const followers = await db.follow.findMany({
      where: { followingId: hostId },
      select: { followerId: true },
    });

    // B. Friends
    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ initiatorId: hostId }, { receiverId: hostId }],
      },
      select: { initiatorId: true, receiverId: true },
    });

    // C. City users (only if PUBLIC or CITY visibility and city is set)
    let cityUsers: { id: string }[] = [];
    if (
      live.city &&
      (live.visibility === "PUBLIC" || live.visibility === "CITY")
    ) {
      cityUsers = await db.user.findMany({
        where: {
          activeCity: { name: live.city },
          id: { not: hostId },
        },
        select: { id: true },
      });
    }

    // D. Plan participants
    let planParticipants: { userId: string }[] = [];
    if (live.planId) {
      planParticipants = await db.planParticipant.findMany({
        where: { planId: live.planId },
        select: { userId: true },
      });
    }

    // Merge all recipient IDs and deduplicate
    const recipientMap = new Map<string, { isCityOnly: boolean }>();

    for (const f of followers) {
      recipientMap.set(f.followerId, { isCityOnly: false });
    }

    for (const fr of friendships) {
      const friendId = fr.initiatorId === hostId ? fr.receiverId : fr.initiatorId;
      recipientMap.set(friendId, { isCityOnly: false });
    }

    for (const u of cityUsers) {
      const existing = recipientMap.get(u.id);
      if (existing) {
        existing.isCityOnly = false; // Also follower or friend
      } else {
        recipientMap.set(u.id, { isCityOnly: true });
      }
    }

    for (const p of planParticipants) {
      const existing = recipientMap.get(p.userId);
      if (existing) {
        existing.isCityOnly = false;
      } else {
        recipientMap.set(p.userId, { isCityOnly: false });
      }
    }

    // Remove host
    recipientMap.delete(hostId);

    const recipientIds = Array.from(recipientMap.entries());

    // Process each recipient
    for (const [recipientId, meta] of recipientIds) {
      // Skip blocked users
      if (await isBlocked(hostId, recipientId)) {
        result.skipped++;
        continue;
      }

      // Anti-duplicate: check if a LIVE_STARTED notification was already sent for this live + recipient in the last 5 minutes
      const recentNotification = await db.notification.findFirst({
        where: {
          type: "LIVE_STARTED",
          recipientId,
          actorId: hostId,
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      if (recentNotification) {
        result.skipped++;
        continue;
      }

      // Check user settings
      const settings = await db.userSettings.findUnique({
        where: { userId: recipientId },
        select: {
          notificationLiveStarted: true,
          notificationCityLives: true,
        },
      });

      if (meta.isCityOnly) {
        if (settings?.notificationCityLives === false) {
          result.skipped++;
          continue;
        }
      } else {
        if (settings?.notificationLiveStarted === false) {
          result.skipped++;
          continue;
        }
      }

      // Build message
      let body = `${live.host.name || "Quelqu'un"} est en live maintenant`;
      if (live.city) {
        body += ` à ${live.city}`;
      }

      let planTitle: string | null = null;
      if (live.planId) {
        const plan = await db.plan.findUnique({
          where: { id: live.planId },
          select: { title: true },
        });
        planTitle = plan?.title || null;
      }

      if (planTitle) {
        body = `${live.host.name || "Quelqu'un"} a lancé un live pour le plan "${planTitle}"`;
      }

      await createNotification({
        type: "LIVE_STARTED",
        title: `${live.host.name || "Quelqu'un"} est en live`,
        body,
        recipientId,
        actorId: hostId,
        actorName: live.host.name,
        actorImage: live.host.image,
        data: { liveId: live.id, url: `/live/${live.id}` },
      });

      result.internalSent++;
      result.recipientsCount++;
    }
  } catch (error) {
    logError("[LIVE_ERROR]", "notifyLiveStarted failed", { error: String(error) });
  }

  return result;
}
