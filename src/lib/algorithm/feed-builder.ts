import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getMomentRankingScore } from "./moment-score";

const MAX_AGE_DAYS = 30;
const CANDIDATE_MULTIPLIER = 3;

interface ViewerContext {
  userId: string;
  activeCity: string | null;
  countryCode: string | null;
  friendIds: Set<string>;
  followingIds: Set<string>;
  blockedIds: Set<string>;
  blockedByIds: Set<string>;
  role: string;
}

interface FeedCandidate {
  id: string;
  score: number;
  createdAt: Date;
  authorId: string;
  city: string | null;
  countryCode: string | null;
  visibility: string;
  isDemo: boolean;
  type: string;
  planId: string | null;
  mediaUrl: string;
  caption: string | null;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    role: string;
    isVerified: boolean;
    isDemoAccount: boolean;
    trustScore: number;
  };
  _count: { likes: number; comments: number };
  audioTrackId: string | null;
  audioStartTime: number | null;
  audioVolume: number | null;
  audioTrack: {
    id: string;
    title: string;
    artistName: string | null;
    audioUrl: string;
    status: string;
  } | null;
}

function getCutoffDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - MAX_AGE_DAYS);
  return d;
}

async function fetchBlockedIds(userId: string): Promise<{ blocked: Set<string>; blockedBy: Set<string> }> {
  const [blocks, blockedBy] = await Promise.all([
    db.userBlock.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
    db.userBlock.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
  ]);
  return {
    blocked: new Set(blocks.map((b) => b.blockedId)),
    blockedBy: new Set(blockedBy.map((b) => b.blockerId)),
  };
}

async function fetchScoreMap(momentIds: string[]): Promise<Map<string, { score: number; viralScore: number; safetyScore: number }>> {
  const scores = await db.momentScore.findMany({
    where: { momentId: { in: momentIds } },
    select: { momentId: true, score: true, viralScore: true, safetyScore: true },
  });
  const map = new Map<string, { score: number; viralScore: number; safetyScore: number }>();
  for (const s of scores) {
    map.set(s.momentId, s);
  }
  return map;
}

function scoreCandidate(
  candidate: FeedCandidate,
  viewer: ViewerContext,
  scoreData: { score: number; viralScore: number; safetyScore: number } | undefined
): number {
  // Safety filter: very low safety = penalize heavily
  if (scoreData && scoreData.safetyScore < 0.3) return -9999;
  if (scoreData && scoreData.safetyScore < 0.5) return -100;

  let rank = getMomentRankingScore(
    {
      id: candidate.id,
      createdAt: candidate.createdAt,
      authorId: candidate.authorId,
      city: candidate.city,
      countryCode: candidate.countryCode,
    },
    {
      id: viewer.userId,
      activeCity: viewer.activeCity,
      countryCode: viewer.countryCode,
      friendIds: viewer.friendIds,
      followingIds: viewer.followingIds,
      blockedIds: viewer.blockedIds,
    },
    scoreData ?? null
  );

  // Creator trust boost
  if (candidate.author.isVerified) rank += 5;
  if (candidate.author.trustScore > 80) rank += 3;

  // Demo account penalty unless verified
  if (candidate.author.isDemoAccount && !candidate.author.isVerified) rank -= 10;

  // Viral boost
  if (scoreData) {
    rank += scoreData.viralScore * 0.5;
  }

  return rank;
}

async function fetchCandidates(
  viewer: ViewerContext,
  limit: number,
  scope: "for-you" | "city" | "friends" | "following",
  cursor?: string,
  since?: Date | null,
  media?: "all" | "posts" | "clips"
): Promise<{ candidates: FeedCandidate[]; nextCursor: string | null }> {
  const now = new Date();
  const cutoff = getCutoffDate();
  const candidateLimit = limit * CANDIDATE_MULTIPLIER;

  // Build base where
  let baseWhere: Prisma.MomentWhereInput = {
    AND: [
      {
        OR: [
          { visibility: "PUBLIC" },
          { authorId: viewer.userId },
          { visibility: "FRIENDS", authorId: { in: Array.from(viewer.friendIds) } },
          { visibility: "PLAN_PARTICIPANTS", planId: { not: null } },
        ],
      },
      { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      { createdAt: { gte: cutoff } },
    ],
  };

  // Exclude blocked users and users who blocked me
  const blockedList = Array.from(viewer.blockedIds);
  const blockedByList = Array.from(viewer.blockedByIds);
  if (blockedList.length > 0 || blockedByList.length > 0) {
    baseWhere = {
      AND: [
        baseWhere,
        { authorId: { notIn: [...blockedList, ...blockedByList] } },
      ],
    };
  }

  // Scope-specific filters
  if (scope === "city" && viewer.activeCity) {
    baseWhere = {
      AND: [baseWhere, { city: { equals: viewer.activeCity, mode: "insensitive" } }],
    };
  } else if (scope === "friends") {
    const friendList = Array.from(viewer.friendIds);
    baseWhere = {
      AND: [baseWhere, { OR: [{ authorId: { in: friendList } }, { authorId: viewer.userId }] }],
    };
  } else if (scope === "following") {
    const followingList = Array.from(viewer.followingIds);
    baseWhere = {
      AND: [baseWhere, { OR: [{ authorId: { in: followingList } }, { authorId: viewer.userId }] }],
    };
  }

  // Media filter
  const mediaWhere: Prisma.MomentWhereInput | undefined =
    media === "posts" ? { type: "PHOTO" } : media === "clips" ? { type: "VIDEO" } : undefined;

  const finalWhere: Prisma.MomentWhereInput = mediaWhere
    ? { AND: [baseWhere, mediaWhere] }
    : baseWhere;

  // Cursor handling for algorithmic feeds: decode composite cursor (score,id)
  let scoreCursor: number | undefined;
  let idCursor: string | undefined;
  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
      if (decoded.score !== undefined && decoded.id) {
        scoreCursor = decoded.score;
        idCursor = decoded.id;
      } else {
        // Fallback to old cursor format (just id)
        idCursor = cursor;
      }
    } catch {
      idCursor = cursor;
    }
  }

  // Fetch candidates
  const moments = await db.moment.findMany({
    where: finalWhere,
    orderBy: scope === "for-you" ? [{ createdAt: "desc" }, { id: "desc" }] : { createdAt: "desc" },
    take: candidateLimit + 1,
    skip: 0,
    cursor: idCursor && !scoreCursor ? { id: idCursor } : undefined,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          role: true,
          isVerified: true,
          isDemoAccount: true,
          trustScore: true,
        },
      },
      _count: { select: { likes: true, comments: true } },
      audioTrack: { select: { id: true, title: true, artistName: true, audioUrl: true, status: true } },
    },
  });

  const hasMore = moments.length > candidateLimit;
  const sliced = hasMore ? moments.slice(0, candidateLimit) : moments;

  // Convert to candidates
  const candidates: FeedCandidate[] = sliced.map((m) => ({
    id: m.id,
    score: 0,
    createdAt: m.createdAt,
    authorId: m.authorId,
    city: m.city,
    countryCode: m.countryCode,
    visibility: m.visibility,
    isDemo: m.isDemo,
    type: m.type,
    planId: m.planId,
    mediaUrl: m.mediaUrl,
    caption: m.caption,
    author: m.author,
    _count: m._count,
    audioTrackId: m.audioTrackId,
    audioStartTime: m.audioStartTime,
    audioVolume: m.audioVolume,
    audioTrack: m.audioTrack,
  }));

  // Fetch scores
  const scoreMap = await fetchScoreMap(candidates.map((c) => c.id));

  // Score each candidate
  for (const c of candidates) {
    const scoreData = scoreMap.get(c.id);
    c.score = scoreCandidate(c, viewer, scoreData);
  }

  // Sort by score descending, then by createdAt descending
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  // Apply anti-spam: max 3 per author in one page
  const authorCounts = new Map<string, number>();
  const filtered: FeedCandidate[] = [];
  for (const c of candidates) {
    const count = authorCounts.get(c.authorId) ?? 0;
    if (count >= 3) continue;
    authorCounts.set(c.authorId, count + 1);
    filtered.push(c);
  }

  // Return top limit
  const result = filtered.slice(0, limit);

  // Build next cursor
  let nextCursor: string | null = null;
  if (result.length > 0 && hasMore) {
    const last = result[result.length - 1];
    const lastScore = scoreMap.get(last.id)?.score ?? 0;
    nextCursor = Buffer.from(JSON.stringify({ score: lastScore, id: last.id })).toString("base64");
  }

  return { candidates: result, nextCursor };
}

export async function buildFeed(
  viewer: {
    userId: string;
    activeCity: string | null;
    countryCode: string | null;
    role: string;
    friendIds: string[];
    followingIds: string[];
  },
  scope: "for-you" | "city" | "friends" | "following",
  limit: number,
  cursor?: string,
  since?: Date | null,
  media?: "all" | "posts" | "clips"
) {
  const blocks = await fetchBlockedIds(viewer.userId);

  const context: ViewerContext = {
    userId: viewer.userId,
    activeCity: viewer.activeCity,
    countryCode: viewer.countryCode,
    friendIds: new Set(viewer.friendIds),
    followingIds: new Set(viewer.followingIds),
    blockedIds: blocks.blocked,
    blockedByIds: blocks.blockedBy,
    role: viewer.role,
  };

  const { candidates, nextCursor } = await fetchCandidates(context, limit, scope, cursor, since, media);

  // For for-you scope, try to blend pools if we don't have enough candidates
  let finalCandidates = candidates;
  if (scope === "for-you" && candidates.length < limit && !cursor) {
    // Try to fetch from other pools to fill
    const needed = limit - candidates.length;
    const [cityPool, friendPool, followingPool] = await Promise.all([
      viewer.activeCity
        ? fetchCandidates(context, needed, "city", undefined, since, media).then((r) => r.candidates)
        : Promise.resolve([]),
      fetchCandidates(context, Math.ceil(needed / 2), "friends", undefined, since, media).then((r) => r.candidates),
      fetchCandidates(context, Math.ceil(needed / 2), "following", undefined, since, media).then((r) => r.candidates),
    ]);

    const existingIds = new Set(candidates.map((c) => c.id));
    const extras: FeedCandidate[] = [];
    for (const c of [...cityPool, ...friendPool, ...followingPool]) {
      if (!existingIds.has(c.id)) extras.push(c);
    }

    // Sort extras by score and append
    extras.sort((a, b) => b.score - a.score);
    finalCandidates = [...candidates, ...extras.slice(0, needed)];
  }

  // Filter plan participants visibility
  const planMomentIds = finalCandidates.filter((c) => c.visibility === "PLAN_PARTICIPANTS" && c.planId).map((c) => c.planId!);
  let allowedPlanIds = new Set<string>();
  if (planMomentIds.length > 0) {
    const [participants, plans] = await Promise.all([
      db.planParticipant.findMany({
        where: { planId: { in: planMomentIds }, userId: viewer.userId },
        select: { planId: true },
      }),
      db.plan.findMany({ where: { id: { in: planMomentIds }, creatorId: viewer.userId }, select: { id: true } }),
    ]);
    allowedPlanIds = new Set([...participants.map((p) => p.planId), ...plans.map((p) => p.id)]);
  }

  const visibleCandidates = finalCandidates.filter((c) => {
    if (c.visibility !== "PLAN_PARTICIPANTS" || !c.planId) return true;
    return allowedPlanIds.has(c.planId);
  });

  // Get liked state
  const momentIds = visibleCandidates.map((c) => c.id);
  let likedSet = new Set<string>();
  if (momentIds.length > 0) {
    const userLikes = await db.momentLike.findMany({
      where: { momentId: { in: momentIds }, userId: viewer.userId },
      select: { momentId: true },
    });
    likedSet = new Set(userLikes.map((l) => l.momentId));
  }

  // Build result
  const moments = visibleCandidates.map((c) => ({
    id: c.id,
    type: c.type,
    mediaUrl: c.mediaUrl,
    caption: c.caption,
    city: c.city,
    countryCode: c.countryCode,
    visibility: c.visibility,
    createdAt: c.createdAt.toISOString(),
    audioTrackId: c.audioTrack?.status !== "BLOCKED" ? c.audioTrackId : null,
    audioStartTime: c.audioTrack?.status !== "BLOCKED" ? c.audioStartTime : null,
    audioVolume: c.audioTrack?.status !== "BLOCKED" ? c.audioVolume : null,
    audioTrack: c.audioTrack && c.audioTrack.status !== "BLOCKED"
      ? {
          id: c.audioTrack.id,
          title: c.audioTrack.title,
          artistName: c.audioTrack.artistName,
          audioUrl: c.audioTrack.audioUrl,
        }
      : null,
    author: {
      id: c.author.id,
      name: c.author.name,
      username: c.author.username,
      image: c.author.image,
      role: c.author.role,
      isVerified: c.author.isVerified,
    },
    _count: { likes: c._count.likes, comments: c._count.comments },
    viewerState: {
      likedByMe: likedSet.has(c.id),
      canDelete: c.authorId === viewer.userId || viewer.role === "ADMIN" || viewer.role === "MODERATOR",
      canReport: c.authorId !== viewer.userId,
    },
  }));

  return { moments, nextCursor };
}
