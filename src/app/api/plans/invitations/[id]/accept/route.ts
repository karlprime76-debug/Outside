import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invitation = await db.planInvitation.findUnique({
      where: { id },
      include: { plan: { select: { id: true, maxParticipants: true, status: true, _count: { select: { participants: true } } } } },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.receiverId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    if (!existingParticipant) {
      await db.planParticipant.create({
        data: { planId: invitation.planId, userId: user.id, status: "CONFIRMED" },
      });

      const updatedCount = invitation.plan._count.participants + 1;
      if (updatedCount >= invitation.plan.maxParticipants && invitation.plan.status === "ACTIVE") {
        await db.plan.update({ where: { id: invitation.planId }, data: { status: "FULL" } });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
