import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canInviteToPlan, isFriend } from "@/lib/plans/permissions";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const allowed = await canInviteToPlan(user.id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = rateLimit(`invite:${user.id}:${id}`, 5, 60000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many invitations. Please slow down." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }

    const body = await req.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    if (!(await isFriend(user.id, userId))) {
      return NextResponse.json({ error: "Must be friends to invite" }, { status: 403 });
    }

    const existing = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "User already joined" }, { status: 409 });
    }

    const existingInvitation = await db.planInvitation.findUnique({
      where: { planId_receiverId: { planId: id, receiverId: userId } },
    });
    if (existingInvitation && existingInvitation.status === "PENDING") {
      return NextResponse.json({ error: "Invitation already sent" }, { status: 409 });
    }

    const invitation = await db.planInvitation.create({
      data: {
        planId: id,
        senderId: user.id,
        receiverId: userId,
        status: "PENDING",
      },
    });

    const invitedUser = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await db.planMessage.create({
      data: {
        planId: id,
        authorId: user.id,
        content: `📩 a invité ${invitedUser?.name || "quelqu'un"} à rejoindre le plan`,
      },
    });

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
