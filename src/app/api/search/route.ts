import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all";

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const currentUserId = session.user.id;

    const blocked = await db.userBlock.findMany({
      where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(blocked.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId)));

    const results: Record<string, unknown[]> = {};

    if (type === "all" || type === "users") {
      const users = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
          ],
          NOT: { id: currentUserId },
          id: { notIn: Array.from(blockedIds) },
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          activeCity: { select: { name: true } },
          country: true,
        },
        take: 5,
      });
      results.users = users.map((u) => ({
        ...u,
        activeCity: u.activeCity?.name || null,
        _type: "user",
      }));
    }

    if (type === "all" || type === "plans") {
      const plans = await db.plan.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          status: "ACTIVE",
        },
        select: {
          id: true,
          title: true,
          mood: true,
          startDate: true,
          city: { select: { name: true } },
          creator: { select: { id: true, name: true, image: true } },
        },
        take: 5,
      });
      results.plans = plans.map((p) => ({
        ...p,
        startDate: p.startDate.toISOString(),
        _type: "plan",
      }));
    }

    if (type === "all" || type === "places") {
      const places = await db.place.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, category: true, city: true, country: true, image: true },
        take: 5,
      });
      results.places = places.map((p) => ({ ...p, _type: "place" }));
    }

    if (type === "all" || type === "moments") {
      const moments = await db.moment.findMany({
        where: {
          caption: { contains: q, mode: "insensitive" },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        select: {
          id: true,
          caption: true,
          mediaUrl: true,
          mediaType: true,
          createdAt: true,
          user: { select: { id: true, name: true, username: true, image: true } },
        },
        take: 5,
      });
      results.moments = moments.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        _type: "moment",
      }));
    }

    return NextResponse.json({ results, query: q });
  } catch (error) {
    console.error("[SEARCH_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
