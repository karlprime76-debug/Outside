import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

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

    // Verify they are friends
    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: userId },
          { initiatorId: userId, receiverId: user.id },
        ],
      },
    });
    if (!friendship) {
      return NextResponse.json({ error: "Must be friends to invite" }, { status: 403 });
    }

    // Check if already participant
    const existing = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "User already joined" }, { status: 409 });
    }

    // Create system message in chat
    const invitedUser = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const message = await db.planMessage.create({
      data: {
        planId: id,
        authorId: user.id,
        content: `📩 a invité ${invitedUser?.name || "quelqu'un"} à rejoindre le plan`,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
