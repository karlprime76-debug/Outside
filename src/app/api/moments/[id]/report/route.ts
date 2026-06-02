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

    const moment = await db.moment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!moment) {
      return NextResponse.json({ error: "Moment not found" }, { status: 404 });
    }

    if (moment.authorId === user.id) {
      return NextResponse.json({ error: "Cannot report your own moment" }, { status: 400 });
    }

    const existing = await db.report.findFirst({
      where: { reporterId: user.id, targetType: "MOMENT", targetId: id },
    });

    if (existing) {
      return NextResponse.json({ error: "Already reported" }, { status: 409 });
    }

    await db.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: moment.authorId,
        targetType: "MOMENT",
        targetId: id,
        reason: "INAPPROPRIATE_CONTENT",
        description: "Moment signalé",
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report moment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
