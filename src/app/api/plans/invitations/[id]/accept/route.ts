import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
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

    const invitation = await db.planInvitation.findUnique({
      where: { id },
      include: {
        plan: {
          select: {
            id: true,
            maxParticipants: true,
            status: true,
            startDate: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.receiverId !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation already processed" }, { status: 409 });
    }

    await db.planInvitation.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });

    const existingParticipant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: invitation.planId, userId: user.id } },
    });

    if (existingParticipant) {
      await db.planParticipant.update({
        where: { planId_userId: { planId: invitation.planId, userId: user.id } },
        data: { attendance },
      });
    } else {
      // Check capacity for GOING only
      if (attendance === "GOING" && invitation.plan.status === "FULL") {
        return NextResponse.json({ error: "Plan complet" }, { status: 409 });
      }

      await db.planParticipant.create({
        data: { planId: invitation.planId, userId: user.id, status: "CONFIRMED", attendance },
      });

      if (attendance === "GOING" && invitation.plan.status === "ACTIVE") {
        const goingCount = await db.planParticipant.count({
          where: { planId: invitation.planId, attendance: "GOING" },
        });
        if (goingCount >= invitation.plan.maxParticipants) {
          await db.plan.update({ where: { id: invitation.planId }, data: { status: "FULL" } });
        }
      }
    }

    createPlanReminders(user.id, invitation.planId, invitation.plan.startDate).catch((err) => { console.error("[PLAN_ERROR] Failed to create plan reminders:", err); });

    db.plan.findUnique({
      where: { id: invitation.planId },
      select: { city: { select: { name: true, countryCode: true } } },
    }).then((plan) => {
      if (plan?.city) {
        recordTripHistory({
          userId: user.id,
          city: plan.city.name,
          countryCode: plan.city.countryCode,
          source: "PLAN_JOINED",
          planId: invitation.planId,
        }).catch((err) => { console.error("[PLAN_ERROR] Failed to record trip history:", err); });
      }
    }).catch((err) => { console.error("[PLAN_ERROR] Failed to lookup plan city:", err); });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
