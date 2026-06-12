import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100);

    const following = await db.follow.findMany({
      where: { followerId: session.user.id },
      include: {
        following: { select: { id: true, name: true, username: true, image: true, activeCity: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    let hasNextPage = false;
    let paginated = following;
    if (following.length > limit) {
      hasNextPage = true;
      paginated = following.slice(0, limit);
    }

    return NextResponse.json({
      following: paginated.map((f) => f.following),
      nextCursor: hasNextPage ? paginated[paginated.length - 1].id : null,
    });
  } catch (error) {
    console.error("[FOLLOWING]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
