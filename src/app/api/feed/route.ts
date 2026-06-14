import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getUserBlockedIds } from "@/lib/blocks";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const blockedIds = userId ? await getUserBlockedIds(userId) : [];

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);
    const city = searchParams.get("city");
    const since = searchParams.get("since");

    const notBlocked = blockedIds.length > 0 ? { authorId: { notIn: blockedIds } } : {};
    const sinceFilter = since ? { createdAt: { gt: new Date(since) } } : {};

    // Fetch moments
    const moments = await db.moment.findMany({
      where: {
        ...notBlocked,
        ...sinceFilter,
        ...(city ? { city } : {}),
        visibility: "PUBLIC",
      },
      orderBy: [{ isSponsored: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        author: { select: { id: true, name: true, username: true, image: true, role: true, isVerified: true, accountKind: true } },
        _count: { select: { reactions: true, comments: true } },
      },
    });

    // Fetch plans (same city if specified)
    const plans = await db.plan.findMany({
      where: {
        status: "ACTIVE",
        visibility: "PUBLIC",
        ...sinceFilter,
        ...(city ? { city: { name: city } } : {}),
        startDate: { gte: new Date() },
        creatorId: userId ? { notIn: blockedIds } : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        creator: { select: { id: true, name: true, username: true, image: true, isVerified: true } },
        city: { select: { name: true } },
        place: { select: { name: true } },
        _count: { select: { participants: true } },
      },
    });

    // Interleave: moments first, then plans, then remaining
    const feed: unknown[] = [];
    const maxIdx = Math.max(moments.length, plans.length);
    for (let i = 0; i < maxIdx; i++) {
      if (i < moments.length) {
        const m = moments[i];
        feed.push({
          __type: "moment",
          id: m.id,
          type: m.type,
          mediaUrl: m.mediaUrl,
          caption: m.caption,
          city: m.city,
          createdAt: m.createdAt.toISOString(),
          author: m.author,
          isSponsored: m.isSponsored,
          _count: { reactions: m._count.reactions, comments: m._count.comments },
          viewerState: {
            likedByMe: false,
            savedByMe: false,
            canDelete: userId === m.authorId,
            canReport: userId !== m.authorId,
          },
        } as never);
      }
      if (i < plans.length) {
        const p = plans[i];
        feed.push({
          __type: "plan",
          id: p.id,
          title: p.title,
          mood: p.mood,
          budgetLevel: p.budgetLevel,
          priceType: p.priceType,
          startDate: p.startDate.toISOString(),
          city: p.city.name,
          place: p.place?.name || null,
          creator: { ...p.creator, id: undefined },
          participantCount: p._count.participants,
          isSponsored: false,
        } as never);
      }
    }

    const nextCursor = moments.length === limit ? moments[moments.length - 1].id : null;

    return NextResponse.json({ feed, nextCursor });
  } catch (error) {
    console.error("[FEED_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
