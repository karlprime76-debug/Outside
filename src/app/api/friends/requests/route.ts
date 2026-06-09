import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const userId = session.user.id;

    const [received, sent] = await Promise.all([
      db.friendRequest.findMany({
        where: { receiverId: userId, status: "PENDING" },
        include: {
          sender: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.friendRequest.findMany({
        where: { senderId: userId, status: "PENDING" },
        include: {
          receiver: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({ received, sent });
  } catch (error) {
    console.error("[FRIEND_REQUESTS]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
