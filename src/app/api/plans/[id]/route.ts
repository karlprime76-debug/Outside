import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";
import { createPlanReminders, removePlanReminders } from "@/lib/plan-reminders";
import { updatePlanSchema } from "@/lib/validation/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const allowed = await canViewPlan(user.id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const plan = await db.plan.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, image: true, isVerified: true } },
        city: true,
        place: true,
        participants: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        polls: {
          include: {
            options: {
              include: {
                votes: { select: { id: true, userId: true } },
              },
            },
          },
        },
        _count: { select: { expenses: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    const going = plan.participants.filter((p) => p.attendance === "GOING").length;
    const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;

    const reminderCount = await db.planReminder.count({
      where: { userId: user.id, planId: id, sentAt: null },
    });

    const safePlan = { ...plan, latitude: undefined, longitude: undefined };
    const planWithCounts = {
      ...safePlan,
      _count: {
        participants: going + maybe, going, maybe,
        expenses: plan._count.expenses,
      },
      hasReminders: reminderCount > 0,
    };

    return NextResponse.json({ plan: planWithCounts });
  } catch (error) {
    logError("[PLAN_ERROR]", "GET /api/plans/[id] failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.plan.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    if (existing.creatorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();

    const parsed = updatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const plan = await db.plan.update({
      where: { id },
      data: {
        ...parsed.data,
        isOfficial: (user.role === "PRO" || user.role === "ADMIN") ? parsed.data.isOfficial : undefined,
        bookingUrl: (user.role === "PRO" || user.role === "ADMIN") ? parsed.data.bookingUrl : undefined,
      },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    logError("[PLAN_ERROR]", "PATCH /api/plans/[id] failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.plan.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    if (existing.creatorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await db.plan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("[PLAN_ERROR]", "DELETE /api/plans/[id] failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const enabled = body.enabled === true;

    const participant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
      include: { plan: { select: { startDate: true } } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Tu n'es pas participant" }, { status: 404 });
    }

    if (enabled) {
      createPlanReminders(user.id, id, participant.plan.startDate).catch((err) => { logError("[PLAN_ERROR]", "Failed to create plan reminders", { error: String(err) }); });
    } else {
      removePlanReminders(user.id, id).catch((err) => { logError("[PLAN_ERROR]", "Failed to remove plan reminders", { error: String(err) }); });
    }

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error("[PLAN_REMINDERS_TOGGLE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
