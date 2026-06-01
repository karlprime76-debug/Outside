import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ initiatorId: user.id }, { receiverId: user.id }],
      },
      include: {
        initiator: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const friends = friendships.map((f) =>
      f.initiatorId === user.id ? f.receiver : f.initiator
    );

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Get friends error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId || userId === user.id) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    // Check if already friends
    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: userId },
          { initiatorId: userId, receiverId: user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }

    const friendship = await db.friendship.create({
      data: {
        initiatorId: user.id,
        receiverId: userId,
      },
    });

    return NextResponse.json({ friendship }, { status: 201 });
  } catch (error) {
    console.error("Create friendship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
