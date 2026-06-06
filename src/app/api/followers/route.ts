import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const followers = await db.follow.findMany({
      where: { followingId: session.user.id },
      include: {
        follower: { select: { id: true, name: true, username: true, image: true, activeCity: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ followers: followers.map((f) => f.follower) });
  } catch (error) {
    console.error("[GET /api/followers] Error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
