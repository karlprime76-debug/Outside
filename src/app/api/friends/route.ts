import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFriendCount } from "@/lib/social/friendship";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const userId = session.user.id;

    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const { userId } = body;
    const currentUserId = session.user.id;

    if (!userId || userId === currentUserId) {
      return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
    }

    const existing = await db.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: currentUserId, receiverId: userId },
          { initiatorId: userId, receiverId: currentUserId },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Déjà amis." }, { status: 409 });
    }

    const friendship = await db.friendship.create({
      data: { initiatorId: currentUserId, receiverId: userId },
    });

    return NextResponse.json({ friendship }, { status: 201 });
  } catch (error) {
    console.error("Create friendship error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
