import { createNotification } from "@/lib/notifications";
import { db } from "@/lib/db";

/**
 * Notify users when new Drops are available in their city
 */
export async function notifyDropAvailable(city: string, dropTitle: string) {
  // Find users with this active city
  const users = await db.user.findMany({
    where: {
      activeCity: { name: city },
      userSettings: {
        notificationPlanInvites: true, // Reuse this setting for drops
      },
    },
    select: { id: true },
  });

  for (const user of users) {
    createNotification({
      type: "DROP_AVAILABLE",
      title: "Nouveau Drop OUTSIDE",
      body: dropTitle,
      recipientId: user.id,
      data: { url: "/home" },
    }).catch((err) => { console.error("[NOTIFICATION_ERROR] Failed to send drop available notification:", err); });
  }
}

/**
 * Notify users when new missions are available in their city
 */
export async function notifyMissionAvailable(city: string, missionTitle: string) {
  const users = await db.user.findMany({
    where: {
      activeCity: { name: city },
      userSettings: {
        notificationPlanInvites: true,
      },
    },
    select: { id: true },
  });

  for (const user of users) {
    createNotification({
      type: "MISSION_AVAILABLE",
      title: "Nouvelle mission disponible",
      body: missionTitle,
      recipientId: user.id,
      data: { url: "/home" },
    }).catch((err) => { console.error("[NOTIFICATION_ERROR] Failed to send mission available notification:", err); });
  }
}

/**
 * Notify user when their weekly recap is ready
 */
export async function notifyWeeklyRecapReady(userId: string) {
  createNotification({
    type: "WEEKLY_RECAP_READY",
    title: "Ta semaine OUTSIDE",
    body: "Découvrez ton récapitulatif hebdomadaire",
    recipientId: userId,
    data: { url: "/activity" },
  }).catch((err) => { console.error("[NOTIFICATION_ERROR] Failed to send weekly recap notification:", err); });
}

/**
 * Notify user about an ambassador to discover in their city
 */
export async function notifyAmbassadorToDiscover(userId: string, ambassadorName: string, city: string) {
  createNotification({
    type: "AMBASSADOR_TO_DISCOVER",
    title: "Ambassadeur à découvrir",
    body: `${ambassadorName} est ambassadeur OUTSIDE à ${city}`,
    recipientId: userId,
    data: { url: `/friends` },
  }).catch((err) => { console.error("[NOTIFICATION_ERROR] Failed to send ambassador notification:", err); });
}
