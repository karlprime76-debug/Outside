import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { logError } from "@/lib/log";

/**
 * Cron route to process plan reminders.
 * Should be called every 5-10 minutes.
 * Protected by CRON_SECRET header.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 5 * 60 * 1000); // 5 min window

  try {
    const reminders = await db.planReminder.findMany({
      where: {
        sentAt: null,
        remindAt: { lte: windowEnd },
      },
      include: {
        plan: { select: { title: true, startDate: true, city: { select: { name: true } } } },
        user: { select: { id: true, userSettings: { select: { notificationPlanReminders: true, pushPlanReminders: true } } } },
      },
      take: 100,
    });

    let sent = 0;

    for (const reminder of reminders) {
      try {
        const settings = reminder.user.userSettings;
        const plan = reminder.plan;

        if (!settings?.notificationPlanReminders) {
          // User disabled reminders, skip and mark as sent to avoid re-processing
          await db.planReminder.update({
            where: { id: reminder.id },
            data: { sentAt: now },
          });
          continue;
        }

        const startDate = new Date(plan.startDate);
        const diffMs = startDate.getTime() - now.getTime();
        const diffMin = Math.round(diffMs / (60 * 1000));
        const diffHrs = Math.round(diffMs / (60 * 60 * 1000));

        let body: string;
        if (diffMin <= 20) {
          body = `Ton plan "${plan.title}" commence dans ${diffMin} min à ${plan.city.name}.`;
        } else if (diffHrs <= 2) {
          body = `Ton plan "${plan.title}" commence dans 1h à ${plan.city.name}.`;
        } else {
          body = `Ton plan "${plan.title}" commence demain à ${plan.city.name}.`;
        }

        await createNotification({
          type: "PLAN_REMINDER",
          title: "Rappel de plan",
          body,
          recipientId: reminder.user.id,
          data: { planId: reminder.planId, url: `/plans/${reminder.planId}` },
        });

        await db.planReminder.update({
          where: { id: reminder.id },
          data: { sentAt: now },
        });

        sent++;
      } catch (err) {
        logError("[PLAN_ERROR]", `Failed to process reminder ${reminder.id}`, { error: String(err) });
      }
    }

    return NextResponse.json({ processed: reminders.length, sent });
  } catch (error) {
    logError("[PLAN_ERROR]", "Cron plan-reminders failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
