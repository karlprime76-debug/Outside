import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const participant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Tu n'es pas participant" }, { status: 404 });
    }

    await db.planParticipant.delete({
      where: { id: participant.id },
    });

    const plan = await db.plan.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });

    if (plan && plan.status === "FULL" && plan._count.participants < plan.maxParticipants) {
      await db.plan.update({ where: { id }, data: { status: "ACTIVE" } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leave plan error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
