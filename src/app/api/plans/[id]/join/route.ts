import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canJoinPlan } from "@/lib/plans/permissions";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const allowed = await canJoinPlan(user.id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plan = await db.plan.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.status === "FULL") {
      return NextResponse.json({ error: "Plan is full" }, { status: 409 });
    }

    if (plan.status === "CANCELLED") {
      return NextResponse.json({ error: "Plan cancelled" }, { status: 409 });
    }

    if (plan._count.participants >= plan.maxParticipants) {
      return NextResponse.json({ error: "Plan is full" }, { status: 409 });
    }

    const existing = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already joined" }, { status: 409 });
    }

    await db.planParticipant.create({
      data: { planId: id, userId: user.id, status: "CONFIRMED" },
    });

    const updatedCount = plan._count.participants + 1;
    if (updatedCount >= plan.maxParticipants) {
      await db.plan.update({ where: { id }, data: { status: "FULL" } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Join plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
