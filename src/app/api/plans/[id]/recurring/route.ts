import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const plan = await db.plan.findUnique({
      where: { id },
      select: { id: true, creatorId: true, recurrence: true, parentPlanId: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    const childPlans = await db.plan.findMany({
      where: { parentPlanId: id },
      orderBy: { startDate: "asc" },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        _count: { select: { participants: true } },
      },
    });

    const parentPlan = plan.parentPlanId
      ? await db.plan.findUnique({
          where: { id: plan.parentPlanId },
          select: { id: true, title: true, startDate: true },
        })
      : null;

    return NextResponse.json({ childPlans, parentPlan, recurrence: plan.recurrence });
  } catch (error) {
    logError("[RECURRING_ERROR]", "GET /api/plans/[id]/recurring failed", { error: String(error) });
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

    const plan = await db.plan.findUnique({
      where: { id },
      select: { id: true, creatorId: true, recurrence: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    if (plan.creatorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (!plan.recurrence) {
      return NextResponse.json({ error: "Ce plan n'est pas récurrent" }, { status: 400 });
    }

    await db.plan.updateMany({
      where: { parentPlanId: id, status: "ACTIVE" },
      data: { status: "CANCELLED" },
    });

    await db.plan.update({
      where: { id },
      data: { recurrence: null, recurrenceEndDate: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("[RECURRING_ERROR]", "DELETE /api/plans/[id]/recurring failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
