import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFriendCount } from "@/lib/social/friendship";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const userId = session.user.id;

    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
        ...(search ? {
          OR: [
            { initiatorId: userId, receiver: { OR: [{ name: { contains: search, mode: "insensitive" } }, { username: { contains: search, mode: "insensitive" } }] } },
            { receiverId: userId, initiator: { OR: [{ name: { contains: search, mode: "insensitive" } }, { username: { contains: search, mode: "insensitive" } }] } },
          ]
        } : {})
      },
      include: {
        initiator: { select: { id: true, name: true, username: true, image: true, activeCity: { select: { name: true } } } },
        receiver: { select: { id: true, name: true, username: true, image: true, activeCity: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const friends = friendships.map((f) =>
      f.initiatorId === userId ? f.receiver : f.initiator
    );

    const count = await getFriendCount(userId);

    return NextResponse.json({ friends, count, maxFriends: 5000 });
  } catch (error) {
    console.error("Get friends error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Use /api/friends/request to send a friend request." }, { status: 400 });
}
