import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createPlanReminders, removePlanReminders } from "@/lib/plan-reminders";

const VALID_ATTENDANCE = ["GOING", "MAYBE", "LEFT"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const attendance = VALID_ATTENDANCE.includes(body.attendance) ? body.attendance : null;

    if (!attendance) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const participant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
      include: { plan: { select: { maxParticipants: true, status: true, startDate: true } } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Non participant" }, { status: 404 });
    }

    if (attendance === "LEFT") {
      await db.planParticipant.delete({
        where: { planId_userId: { planId: id, userId: user.id } },
      });

      removePlanReminders(user.id, id).catch((err) => { console.error("[PLAN_ERROR] Failed to remove plan reminders:", err); });

      // Recalculate plan status
      const goingCount = await db.planParticipant.count({
        where: { planId: id, attendance: "GOING" },
      });
      if (participant.plan.status === "FULL" && goingCount < participant.plan.maxParticipants) {
        await db.plan.update({ where: { id }, data: { status: "ACTIVE" } });
      }

      return NextResponse.json({ success: true, left: true });
    }

    if (attendance === "GOING" && participant.plan.status === "FULL") {
      const goingCount = await db.planParticipant.count({
        where: { planId: id, attendance: "GOING" },
      });
      if (goingCount >= participant.plan.maxParticipants) {
        return NextResponse.json({ error: "Plan complet" }, { status: 409 });
      }
    }

    await db.planParticipant.update({
      where: { planId_userId: { planId: id, userId: user.id } },
      data: { attendance },
    });

    createPlanReminders(user.id, id, participant.plan.startDate).catch((err) => { console.error("[PLAN_ERROR] Failed to create plan reminders:", err); });

    // Recalculate FULL status
    if (attendance === "GOING") {
      const goingCount = await db.planParticipant.count({
        where: { planId: id, attendance: "GOING" },
      });
      if (goingCount >= participant.plan.maxParticipants && participant.plan.status === "ACTIVE") {
        await db.plan.update({ where: { id }, data: { status: "FULL" } });
      }
    } else if (attendance === "MAYBE" && participant.plan.status === "FULL") {
      const goingCount = await db.planParticipant.count({
        where: { planId: id, attendance: "GOING" },
      });
      if (goingCount < participant.plan.maxParticipants) {
        await db.plan.update({ where: { id }, data: { status: "ACTIVE" } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attendance update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
