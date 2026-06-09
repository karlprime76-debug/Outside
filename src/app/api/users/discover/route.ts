import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const currentUserId = session.user.id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "around";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);

    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: { activeCityId: true, homeCityId: true, countryCode: true },
    });

    if (!currentUser) {
      return NextResponse.json({ users: [] });
    }

    // Exclude self + existing relationships
    const [friendships, requests, follows, blocks] = await Promise.all([
      db.friendship.findMany({
        where: { OR: [{ initiatorId: currentUserId }, { receiverId: currentUserId }] },
        select: { initiatorId: true, receiverId: true },
      }),
      db.friendRequest.findMany({
        where: { OR: [{ senderId: currentUserId }, { receiverId: currentUserId }], status: { in: ["PENDING", "ACCEPTED"] } },
        select: { senderId: true, receiverId: true },
      }),
      db.follow.findMany({ where: { followerId: currentUserId }, select: { followingId: true } }),
      db.userBlock.findMany({
        where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    const excludeIds = new Set<string>([currentUserId]);
    friendships.forEach((f) => excludeIds.add(f.initiatorId === currentUserId ? f.receiverId : f.initiatorId));
    requests.forEach((r) => excludeIds.add(r.senderId === currentUserId ? r.receiverId : r.senderId));
    follows.forEach((f) => excludeIds.add(f.followingId));
    blocks.forEach((b) => excludeIds.add(b.blockerId === currentUserId ? b.blockedId : b.blockerId));

    let users: Array<{
      id: string; name: string | null; username: string | null; image: string | null;
      isVerified: boolean; activeCity: { name: string } | null; _count?: { moments: number };
    }> = [];

    if (type === "creators") {
      // Users with most recent public moments
      users = await db.user.findMany({
        where: {
          id: { notIn: Array.from(excludeIds) },
          moments: { some: { visibility: "PUBLIC", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        },
        select: {
          id: true, name: true, username: true, image: true, isVerified: true,
          activeCity: { select: { name: true } },
          _count: { select: { moments: true } },
        },
        orderBy: { moments: { _count: "desc" } },
        take: limit,
      });
    } else {
      // city-active = same city or country, recently active
      users = await db.user.findMany({
        where: {
          id: { notIn: Array.from(excludeIds) },
          OR: [
            { activeCityId: currentUser.activeCityId },
            { homeCityId: currentUser.homeCityId },
            { countryCode: currentUser.countryCode },
          ],
        },
        select: {
          id: true, name: true, username: true, image: true, isVerified: true,
          activeCity: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    }

    const results = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      isVerified: u.isVerified,
      activeCity: u.activeCity?.name || null,
      momentsCount: u._count?.moments || 0,
    }));

    return NextResponse.json({ users: results });
    } catch (error) {
      console.error("[USERS_DISCOVER]", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }