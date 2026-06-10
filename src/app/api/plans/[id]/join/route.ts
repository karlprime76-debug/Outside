import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canJoinPlan } from "@/lib/plans/permissions";
import { evaluateBadgesAfterPlanJoined } from "@/lib/badges";
import { createPlanReminders } from "@/lib/plan-reminders";
import { recordTripHistory } from "@/lib/passport";

const VALID_ATTENDANCE = ["GOING", "MAYBE"] as const;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const attendance = VALID_ATTENDANCE.includes(body.attendance) ? body.attendance : "GOING";

    const allowed = await canJoinPlan(user.id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const plan = await db.plan.findUnique({
      where: { id },
      include: { participants: { where: { attendance: "GOING" } }, city: { select: { name: true, countryCode: true } } },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    if (plan.status === "CANCELLED") {
      return NextResponse.json({ error: "Plan annulé" }, { status: 409 });
    }

    const goingCount = plan.participants.length;
    if (attendance === "GOING" && (plan.status === "FULL" || goingCount >= plan.maxParticipants)) {
      return NextResponse.json({ error: "Plan complet" }, { status: 409 });
    }

    const existing = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
    });

    // Use transaction to prevent race conditions on capacity
    await db.$transaction(async (tx) => {
      if (existing) {
        await tx.planParticipant.update({
          where: { planId_userId: { planId: id, userId: user.id } },
          data: { attendance },
        });

        if (attendance !== "LEFT") {
          createPlanReminders(user.id, id, plan.startDate).catch((err) => {
            console.error("[POST /api/plans/:id/join] Background task error:", err);
          });
        }

        return;
      }

      // Re-check capacity inside transaction
      const freshGoing = await tx.planParticipant.count({
        where: { planId: id, attendance: "GOING" },
      });
      if (attendance === "GOING" && freshGoing >= plan.maxParticipants) {
        throw new Error("Plan complet");
      }

      await tx.planParticipant.create({
        data: { planId: id, userId: user.id, status: "CONFIRMED", attendance },
      });

      const newGoingCount = freshGoing + (attendance === "GOING" ? 1 : 0);
      if (newGoingCount >= plan.maxParticipants) {
        await tx.plan.update({ where: { id }, data: { status: "FULL" } });
      }
    });

    createPlanReminders(user.id, id, plan.startDate).catch((err) => {
      console.error("[POST /api/plans/:id/join] Background task error:", err);
    });
    evaluateBadgesAfterPlanJoined(user.id).catch((err) => {
      console.error("[POST /api/plans/:id/join] Background task error:", err);
    });

    if (plan.city) {
      recordTripHistory({
        userId: user.id,
        city: plan.city.name,
        countryCode: plan.city.countryCode,
        source: "PLAN_JOINED",
        planId: id,
      }).catch((err) => {
        console.error("[POST /api/plans/:id/join] Background task error:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Join plan error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
