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
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get user's profile for city
    const userProfile = await db.user.findUnique({
      where: { id: userId },
      select: {
        activeCity: {
          select: {
            name: true,
          },
        },
      },
    });

    const userCity = userProfile?.activeCity?.name;

    // Get user's follows
    const follows = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followedIds = new Set(follows.map((f) => f.followingId));

    // Get user's blocks
    const blocks = await db.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blockedIds = new Set(blocks.map((b) => b.blockedId));

    // Get friends (mutual follows)
    const friendIds = new Set<string>();
    for (const follow of follows) {
      const mutualFollow = await db.follow.findFirst({
        where: {
          followerId: follow.followingId,
          followingId: userId,
        },
      });
      if (mutualFollow) {
        friendIds.add(follow.followingId);
      }
    }

    // Get accounts friends follow (friends of friends)
    const friendsOfFriendsIds = new Set<string>();
    for (const friendId of friendIds) {
      const friendFollows = await db.follow.findMany({
        where: { followerId: friendId },
        select: { followingId: true },
      });
      friendFollows.forEach((f) => {
        if (f.followingId !== userId && !followedIds.has(f.followingId)) {
          friendsOfFriendsIds.add(f.followingId);
        }
      });
    }

    // Get accounts whose moments I've liked
    const likedMoments = await db.momentLike.findMany({
      where: { userId },
      select: { momentId: true },
    });
    const likedMomentIds = new Set(likedMoments.map((l) => l.momentId).filter(Boolean));
    
    // Get author IDs for those moments
    const likedMomentDetails = await db.moment.findMany({
      where: {
        id: { in: Array.from(likedMomentIds) },
      },
      select: { authorId: true },
    });
    const likedAuthorIds = new Set(likedMomentDetails.map((m) => m.authorId).filter(Boolean));

    // Get accounts I've opened (from moment events)
    const profileOpens = await db.momentEvent.findMany({
      where: {
        userId,
        type: "PROFILE_OPEN",
      },
      select: { momentId: true },
    });
    const openedMomentIds = new Set(profileOpens.map((e) => e.momentId).filter(Boolean));
    
    // Get author IDs for those moments
    const openedMoments = await db.moment.findMany({
      where: {
        id: { in: Array.from(openedMomentIds) },
      },
      select: { authorId: true },
    });
    const openedAuthorIds = new Set(openedMoments.map((m) => m.authorId).filter(Boolean));

    // Get moment creators (users with moments)
    const momentCreators = await db.moment.findMany({
      where: {
        visibility: "PUBLIC",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      select: { authorId: true },
      distinct: ["authorId"],
    });
    const creatorIds = new Set(momentCreators.map((m) => m.authorId));

    // Get verified accounts
    const verifiedAccounts = await db.user.findMany({
      where: {
        isVerified: true,
      },
      select: { id: true },
    });
    const verifiedIds = new Set(verifiedAccounts.map((u) => u.id));

    // Get active accounts (recent activity)
    const activeAccounts = await db.moment.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      },
      select: { authorId: true },
      distinct: ["authorId"],
    });
    const activeIds = new Set(activeAccounts.map((m) => m.authorId));

    // Get clip creators (video moments)
    const clipCreators = await db.moment.findMany({
      where: {
        type: "VIDEO",
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // Last 14 days
      },
      select: { authorId: true },
      distinct: ["authorId"],
    });
    const clipCreatorIds = new Set(clipCreators.map((m) => m.authorId));

    // Build candidate set with scores
    const candidateScores = new Map<string, { score: number; reasons: string[] }>();

    // Score based on criteria
    const scoreCandidate = (id: string, score: number, reason: string) => {
      if (id === userId || followedIds.has(id) || blockedIds.has(id)) return;
      const current = candidateScores.get(id) || { score: 0, reasons: [] };
      current.score += score;
      if (!current.reasons.includes(reason)) {
        current.reasons.push(reason);
      }
      candidateScores.set(id, current);
    };

    // Same city (high priority)
    if (userCity) {
      const cityUsers = await db.user.findMany({
        where: {
          activeCity: {
            name: userCity,
          },
          id: { not: userId },
        },
        select: { id: true },
      });
      cityUsers.forEach((u) => {
        if (activeIds.has(u.id)) {
          scoreCandidate(u.id, 30, "Actif dans ta ville");
        }
      });
    }

    // Friends of friends (high priority)
    friendsOfFriendsIds.forEach((id) => {
      scoreCandidate(id, 25, "Suivi par tes amis");
    });

    // Verified accounts (medium priority)
    verifiedIds.forEach((id) => {
      scoreCandidate(id, 20, "Compte vérifié");
    });

    // Moment creators (medium priority)
    creatorIds.forEach((id) => {
      scoreCandidate(id, 15, "Créateur de Moments");
    });

    // Clip creators (medium priority)
    clipCreatorIds.forEach((id) => {
      scoreCandidate(id, 20, "Publie souvent des Clips");
    });

    // Accounts whose moments I've liked (medium priority)
    likedAuthorIds.forEach((id) => {
      scoreCandidate(id, 18, "Contenu que tu as aimé");
    });

    // Accounts I've opened (low priority)
    openedAuthorIds.forEach((id) => {
      scoreCandidate(id, 10, "Profil que tu as consulté");
    });

    // Sort by score and get top candidates
    const sortedCandidates = Array.from(candidateScores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit * 2); // Fetch more to allow for filtering

    // Get user details for candidates
    const candidateIds = sortedCandidates.map(([id]) => id);
    const users = await db.user.findMany({
      where: {
        id: { in: candidateIds },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        activeCity: {
          select: {
            name: true,
          },
        },
        isVerified: true,
        role: true,
        isDemoAccount: true,
      },
    });

    // Limit demo accounts (max 1)
    let demoCount = 0;
    const filteredUsers = users.filter((u) => {
      if (u.isDemoAccount) {
        demoCount++;
        return demoCount <= 1;
      }
      return true;
    });

    // Build response with reasons
    const suggestions = filteredUsers
      .slice(0, limit)
      .map((u) => {
        const scoreData = candidateScores.get(u.id);
        const reasons = scoreData?.reasons || [];
        
        // Pick best reason for display
        let displayReason = "À découvrir";
        if (reasons.includes("Actif dans ta ville")) {
          displayReason = "Actif dans ta ville";
        } else if (reasons.includes("Suivi par tes amis")) {
          displayReason = "Suivi par tes amis";
        } else if (reasons.includes("Publie souvent des Clips")) {
          displayReason = "Publie souvent des Clips";
        } else if (reasons.includes("Créateur de Moments")) {
          displayReason = "Créateur populaire";
        } else if (reasons.includes("Compte vérifié")) {
          displayReason = "Compte vérifié";
        }

        return {
          id: u.id,
          name: u.name,
          username: u.username,
          image: u.image,
          city: u.activeCity?.name,
          isVerified: u.isVerified,
          isOfficial: false,
          accountKind: u.isDemoAccount ? "DEMO" : "REAL",
          reason: displayReason,
          viewerState: {
            isFollowing: followedIds.has(u.id),
          },
        };
      })
      .sort((a, b) => {
        // Sort by verified first
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        return 0;
      });

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching user suggestions:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
