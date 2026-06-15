import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 25);

    const userProfile = await db.user.findUnique({
      where: { id: userId },
      select: {
        activeCity: { select: { name: true } },
        role: true,
      },
    });
    const userCity = userProfile?.activeCity?.name;
    const now = new Date();

    // ——— Exclusions ———
    const follows = await db.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    const followedIds = new Set(follows.map((f) => f.followingId));

    const [blocks, blocksOfMe] = await Promise.all([
      db.userBlock.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
      db.userBlock.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
    ]);
    const excludedIds = new Set([userId, ...followedIds, ...blocks.map((b) => b.blockedId), ...blocksOfMe.map((b) => b.blockerId)]);

    // ——— Friends (mutual follows) ———
    const followingIds = follows.map((f) => f.followingId);
    const mutualFollows = followingIds.length > 0
      ? await db.follow.findMany({
          where: { followingId: userId, followerId: { in: followingIds } },
          select: { followerId: true },
        })
      : [];
    const friendIds = new Set(mutualFollows.map((f) => f.followerId));

    // ——— Friends of friends (batch) ———
    const friendsOfFriendsIds = new Set<string>();
    if (friendIds.size > 0) {
      const fofFollows = await db.follow.findMany({
        where: { followerId: { in: Array.from(friendIds) } },
        select: { followingId: true },
      });
      fofFollows.forEach((f) => {
        if (!excludedIds.has(f.followingId)) friendsOfFriendsIds.add(f.followingId);
      });
    }

    // ——— User interaction data ———
    const [likedMoments, profileOpenEvents] = await Promise.all([
      db.momentReaction.findMany({ where: { userId }, select: { momentId: true } }),
      db.momentEvent.findMany({ where: { userId, type: "PROFILE_OPEN" }, select: { momentId: true } }),
    ]);
    const [likedMomentAuthors, openedMomentAuthors] = await Promise.all([
      db.moment.findMany({ where: { id: { in: likedMoments.map(l => l.momentId) } }, select: { authorId: true } }),
      db.moment.findMany({ where: { id: { in: profileOpenEvents.map(e => e.momentId) } }, select: { authorId: true } }),
    ]);
    const likedAuthorIds = new Set(likedMomentAuthors.map((m) => m.authorId).filter(Boolean));
    const openedAuthorIds = new Set(openedMomentAuthors.map((m) => m.authorId).filter(Boolean));

    // ——— Activity & creator sets ———
    const [recentCreators, lastWeekActive, clipCreators] = await Promise.all([
      db.moment.findMany({
        where: { visibility: "PUBLIC", createdAt: { gte: new Date(now.getTime() - 30 * 86400000) } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
      db.moment.findMany({
        where: { createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
      db.moment.findMany({
        where: { type: "VIDEO", createdAt: { gte: new Date(now.getTime() - 14 * 86400000) } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
    ]);
    const creatorIds = new Set(recentCreators.map((m) => m.authorId));
    const activeIds = new Set(lastWeekActive.map((m) => m.authorId));
    const clipCreatorIds = new Set(clipCreators.map((m) => m.authorId));

    // ——— Official accounts ———
    const officialAccounts = await db.user.findMany({
      where: { OR: [{ role: "ADMIN" }, { isAmbassador: true }], userSettings: { privateDiscoveryMode: false } },
      select: { id: true },
    });
    const officialIds = new Set(officialAccounts.map((u) => u.id));

    // ——— Score candidates ———
    const candidateScores = new Map<string, { score: number; reasons: string[] }>();

    const addCandidate = (id: string, points: number, reason: string) => {
      if (excludedIds.has(id)) return;
      const entry = candidateScores.get(id) || { score: 0, reasons: [] };
      entry.score += points;
      if (!entry.reasons.includes(reason)) entry.reasons.push(reason);
      candidateScores.set(id, entry);
    };

    // 1. Official accounts (highest priority)
    officialIds.forEach((id) => addCandidate(id, 35, "Compte officiel"));

    // 2. Same city + active
    if (userCity) {
      const cityUsers = await db.user.findMany({
        where: { activeCity: { name: userCity }, id: { not: userId }, userSettings: { privateDiscoveryMode: false } },
        select: { id: true },
      });
      cityUsers.forEach((u) => {
        if (activeIds.has(u.id)) addCandidate(u.id, 30, "Actif dans ta ville");
      });
    }

    // 3. Friends of friends
    friendsOfFriendsIds.forEach((id) => addCandidate(id, 25, "Suivi par tes amis"));

    // 4. Creators I've interacted with
    likedAuthorIds.forEach((id) => addCandidate(id, 22, "Créateur populaire"));
    openedAuthorIds.forEach((id) => addCandidate(id, 18, "Créateur populaire"));

    // 5. Clip creators
    clipCreatorIds.forEach((id) => addCandidate(id, 20, "Publie souvent des Clips"));

    // 6. General creators
    creatorIds.forEach((id) => addCandidate(id, 12, "Créateur populaire"));

    // ——— Sort & fetch ———
    const sorted = Array.from(candidateScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit * 2);

    const candidateIds = sorted.map(([id]) => id);
    const candidates = candidateIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: candidateIds }, userSettings: { privateDiscoveryMode: false } },
          select: {
            id: true, name: true, username: true, image: true,
            activeCity: { select: { name: true } },
            isVerified: true, role: true, isDemoAccount: true, accountKind: true, isAmbassador: true,
          },
        })
      : [];

    // ——— Filter & build response ———
    const candidateMap = new Map(candidates.map((u) => [u.id, u]));
    let demoCount = 0;

    const suggestions = sorted
      .map(([id]) => candidateMap.get(id))
      .filter((u): u is NonNullable<typeof u> => {
        if (!u) return false;
        if (u.isDemoAccount) { demoCount++; return demoCount <= 1; }
        return true;
      })
      .slice(0, limit)
      .map((u) => {
        const reasons = candidateScores.get(u.id)?.reasons || [];
        const displayReason = reasons.find((r) =>
          ["Compte officiel", "Actif dans ta ville", "Suivi par tes amis", "Publie souvent des Clips", "Créateur populaire"].includes(r)
        ) || "À découvrir";

        return {
          id: u.id,
          name: u.name,
          username: u.username,
          image: u.image,
          city: u.activeCity?.name,
          isVerified: u.isVerified,
          isOfficial: u.role === "ADMIN" || u.isAmbassador,
          accountKind: u.accountKind,
          reason: displayReason,
          viewerState: { isFollowing: followedIds.has(u.id) },
        };
      })
      .sort((a, b) => {
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return 0;
      });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[SUGGESTIONS]", error);
    return NextResponse.json({ error: "Erreur lors du chargement des suggestions" }, { status: 500 });
  }
}
