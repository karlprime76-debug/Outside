import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRelationshipStatuses } from "@/lib/social/friendship";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const currentUserId = session.user.id;

    const currentUser = await db.user.findUnique({
      where: { id: currentUserId },
      select: { activeCityId: true, homeCityId: true, countryCode: true },
    });

    if (!currentUser) {
      return NextResponse.json({ suggestions: [] });
    }

    const [friendships, requests, follows, blocks] = await Promise.all([
      db.friendship.findMany({
        where: { OR: [{ initiatorId: currentUserId }, { receiverId: currentUserId }] },
        select: { initiatorId: true, receiverId: true },
      }),
      db.friendRequest.findMany({
        where: {
          OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        select: { senderId: true, receiverId: true },
      }),
      db.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      }),
      db.userBlock.findMany({
        where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    const excludeIds = new Set<string>();
    excludeIds.add(currentUserId);

    friendships.forEach((f) => {
      excludeIds.add(f.initiatorId === currentUserId ? f.receiverId : f.initiatorId);
    });

    requests.forEach((r) => {
      excludeIds.add(r.senderId === currentUserId ? r.receiverId : r.senderId);
    });

    follows.forEach((f) => excludeIds.add(f.followingId));

    blocks.forEach((b) => {
      excludeIds.add(b.blockerId === currentUserId ? b.blockedId : b.blockerId);
    });

    const suggestions = await db.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        NOT: { id: currentUserId },
        OR: [
          { activeCityId: currentUser.activeCityId },
          { homeCityId: currentUser.homeCityId },
          { countryCode: currentUser.countryCode },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        activeCity: { select: { name: true } },
        homeCity: { select: { name: true } },
        country: true,
        countryCode: true,
        createdAt: true,
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const suggestionIds = suggestions.map((u) => u.id);
    const relationshipMap = await getRelationshipStatuses(currentUserId, suggestionIds);

    const results = suggestions.map((u) => {
      let reason = "Autour de toi";
      if (u.activeCity?.name && currentUser.activeCityId) {
        reason = "Même ville";
      } else if (u.countryCode && u.countryCode === currentUser.countryCode) {
        reason = "Même pays";
      } else if (u.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
        reason = "Nouveau sur OUTSIDE";
      }

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        image: u.image,
        activeCity: u.activeCity?.name || null,
        country: u.country,
        reason,
        relationshipStatus: relationshipMap.get(u.id) || "NONE",
      };
    });

    return NextResponse.json({ suggestions: results });
  } catch (error) {
    console.error("[GET /api/friends/suggestions] Error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
