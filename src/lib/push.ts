import webPush from "web-push";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:contact@outside.app";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return;
    }

    const subs = await db.pushSubscription.findMany({
      where: { userId },
    });

    if (subs.length === 0) return;

    const pushPayload = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            // Subscription expired or invalid
            await db.pushSubscription.delete({ where: { id: sub.id } }).catch((err) => { logError("[PUSH_ERROR]", "Failed to delete expired subscription", { error: String(err) }); });
          } else {
            logError("[PUSH_ERROR]", "sendPushNotification failed for subscription", {
              userId,
              endpoint: sub.endpoint.slice(0, 60),
              error: String(err),
            });
          }
        }
      })
    );
  } catch (error) {
    logError("[PUSH_ERROR]", "sendPushNotification failed", { error: String(error) });
  }
}

export async function sendPushToUser(
  userId: string,
  type: "dm" | "plan" | "plan-reminder" | "moment" | "live" | "pro" | "friend" | "system",
  payload: PushPayload
) {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) return;

    const settings = await db.userSettings.findUnique({
      where: { userId },
      select: {
        pushEnabled: true,
        pushDm: true,
        pushPlans: true,
        pushPlanReminders: true,
        pushMoments: true,
        pushLive: true,
        pushPro: true,
      },
    });

    if (!settings?.pushEnabled) return;

    const categoryMap: Record<string, keyof typeof settings> = {
      dm: "pushDm",
      plan: "pushPlans",
      "plan-reminder": "pushPlanReminders",
      moment: "pushMoments",
      live: "pushLive",
      pro: "pushPro",
      friend: "pushDm",
      system: "pushEnabled",
    };

    const settingKey = categoryMap[type];
    if (settingKey && !settings[settingKey]) return;

    await sendPushNotification(userId, payload);
  } catch (error) {
    logError("[PUSH_ERROR]", "sendPushToUser failed", { error: String(error) });
  }
}
