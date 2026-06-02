import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, messageId } = await params;

    const allowed = await canViewPlan(user.id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await db.planMessage.findUnique({
      where: { id: messageId },
      select: { authorId: true, planId: true },
    });

    if (!message || message.planId !== id) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.authorId === user.id) {
      return NextResponse.json({ error: "Cannot report your own message" }, { status: 400 });
    }

    const existing = await db.report.findFirst({
      where: { reporterId: user.id, targetType: "PLAN_MESSAGE", targetId: messageId },
    });

    if (existing) {
      return NextResponse.json({ error: "Already reported" }, { status: 409 });
    }

    await db.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: message.authorId,
        planId: id,
        targetType: "PLAN_MESSAGE",
        targetId: messageId,
        reason: "INAPPROPRIATE_CONTENT",
        description: "Message signalé depuis le chat du plan",
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
