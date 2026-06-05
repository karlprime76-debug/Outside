import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canJoinPlan } from "@/lib/plans/permissions";
import { evaluateBadgesAfterPlanJoined } from "@/lib/badges";

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
      include: { participants: { where: { attendance: "GOING" } } },
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

    if (existing) {
      // Update attendance if already participating
      await db.planParticipant.update({
        where: { planId_userId: { planId: id, userId: user.id } },
        data: { attendance },
      });
      return NextResponse.json({ success: true, updated: true });
    }

    await db.planParticipant.create({
      data: { planId: id, userId: user.id, status: "CONFIRMED", attendance },
    });

    const newGoingCount = goingCount + (attendance === "GOING" ? 1 : 0);
    if (newGoingCount >= plan.maxParticipants) {
      await db.plan.update({ where: { id }, data: { status: "FULL" } });
    }

    evaluateBadgesAfterPlanJoined(user.id).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Join plan error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
