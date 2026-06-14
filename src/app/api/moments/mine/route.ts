import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    let limit = parseInt(searchParams.get("limit") || "20", 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    const now = new Date();

    const moments = await db.moment.findMany({
      where: {
        authorId: user.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        mediaUrl: true,
        caption: true,
        type: true,
        createdAt: true,
        expiresAt: true,
        visibility: true,
        city: true,
      },
    });

    const hasMore = moments.length > limit;
    const items = hasMore ? moments.slice(0, limit) : moments;

    return NextResponse.json({
      moments: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    }, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
