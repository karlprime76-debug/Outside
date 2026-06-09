import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { logError } from "@/lib/log";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  try {
    const expiredPlans = await db.plan.findMany({
      where: {
        status: { in: ["ACTIVE", "FULL"] },
        endDate: { lte: now },
      },
      select: {
        id: true,
        title: true,
        participants: {
          where: { attendance: { not: "LEFT" } },
          select: { userId: true },
        },
      },
      take: 50,
    });

    let completed = 0;

    for (const plan of expiredPlans) {
      try {
        await db.plan.update({
          where: { id: plan.id },
          data: { status: "COMPLETED" },
        });

        const participantIds = [...new Set(plan.participants.map((p) => p.userId))];

        for (const userId of participantIds) {
          await createNotification({
            type: "PLAN_REVIEW_PENDING",
            title: "Plan terminé — donne ton avis",
            body: `Le plan "${plan.title}" est terminé. Évalue les participants pour renforcer la confiance.`,
            recipientId: userId,
            data: { planId: plan.id, url: `/plans/${plan.id}` },
          });
        }

        try {
          const { calculateUserTrust } = await import("@/lib/trust/calculate-user-trust");
          for (const userId of participantIds) {
            await calculateUserTrust(userId).catch(() => {});
          }
          const { calculatePlanConfirmation } = await import("@/lib/trust/calculate-user-trust");
          await calculatePlanConfirmation(plan.id).catch(() => {});
        } catch {
          // Non-blocking
        }

        completed++;
      } catch (err) {
        logError("[PLAN_COMPLETE]", `Failed to complete plan ${plan.id}`, { error: String(err) });
      }
    }

    return NextResponse.json({ processed: expiredPlans.length, completed });
  } catch (error) {
    logError("[PLAN_COMPLETE]", "Cron complete-plans failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
