import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const following = await db.follow.findMany({
      where: { followerId: session.user.id },
      include: {
        following: { select: { id: true, name: true, username: true, image: true, activeCity: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ following: following.map((f) => f.following) });
  } catch (error) {
    console.error("[GET /api/following] Error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
