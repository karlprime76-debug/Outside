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
  preferredMoods: string[];
  preferredBudget: string | null;
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
  _count: { reactions: number; comments: number };
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
  plan?: {
    mood: string;
    budgetLevel: string;
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

async function fetchReportedContentIds(): Promise<Set<string>> {
  const reports = await db.report.findMany({
    where: {
      targetType: "MOMENT",
      status: { in: ["PENDING", "OPEN", "REVIEWING"] },
    },
    select: { targetId: true, reason: true },
  });

  const counts = new Map<string, { count: number; serious: boolean }>();
  const seriousReasons = new Set<import("@prisma/client").ReportReason>(["VIOLENCE", "HATE", "SEXUAL_CONTENT", "UNDERAGE", "SCAM"]);
  for (const r of reports) {
    if (!r.targetId) continue;
    const entry = counts.get(r.targetId) ?? { count: 0, serious: false };
    entry.count++;
    if (r.reason && seriousReasons.has(r.reason)) entry.serious = true;
    counts.set(r.targetId, entry);
  }

  const excluded = new Set<string>();
  for (const [id, data] of counts) {
    if (data.count >= 2 || data.serious) excluded.add(id);
  }
  return excluded;
}

async function fetchScoreMap(momentIds: string[]): Promise<Map<string, { score: number; viralScore: number; safetyScore: number; localScore: number }>> {
  const scores = await db.momentScore.findMany({
    where: { momentId: { in: momentIds } },
    select: { momentId: true, score: true, viralScore: true, safetyScore: true, localScore: true },
  });
  const map = new Map<string, { score: number; viralScore: number; safetyScore: number; localScore: number }>();
  for (const s of scores) {
    map.set(s.momentId, s);
  }
  return map;
}

async function fetchUserQualityScores(authorIds: string[]): Promise<Map<string, number>> {
  const scores = await db.userQualityScore.findMany({
    where: { userId: { in: authorIds } },
    select: { userId: true, score: true },
  });
  const map = new Map<string, number>();
  for (const s of scores) {
    map.set(s.userId, s.score);
  }
  return map;
}

async function fetchNewCreators(
  viewer: ViewerContext,
  limit: number
): Promise<FeedCandidate[]> {
  const now = new Date();
  const cutoff = getCutoffDate();

  // Find users with few moments (new creators)
  const authorMomentCounts = await db.moment.groupBy({
    by: ["authorId"],
    where: { createdAt: { gte: cutoff } },
    _count: { id: true },
  });

  const newCreatorIds = authorMomentCounts
    .filter((a) => a._count.id <= 5) // Few moments
    .map((a) => a.authorId);

  if (newCreatorIds.length === 0) return [];

  // Fetch moments from new creators
  const moments = await db.moment.findMany({
    where: {
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
        { authorId: { in: newCreatorIds } },
        { authorId: { notIn: Array.from(viewer.blockedIds) } },
        { authorId: { notIn: Array.from(viewer.blockedByIds) } },
        { isDemo: false },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
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
      _count: { select: { reactions: true, comments: true } },
      audioTrack: { select: { id: true, title: true, artistName: true, audioUrl: true, status: true } },
    },
  });

  return moments.map((m) => ({
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
}

async function fetchExploration(
  viewer: ViewerContext,
  limit: number
): Promise<FeedCandidate[]> {
  const now = new Date();
  const cutoff = getCutoffDate();

  // Fetch random moments for exploration (excluding friends/following)
  const moments = await db.moment.findMany({
    where: {
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
        { authorId: { notIn: Array.from(viewer.friendIds) } },
        { authorId: { notIn: Array.from(viewer.followingIds) } },
        { authorId: { notIn: Array.from(viewer.blockedIds) } },
        { authorId: { notIn: Array.from(viewer.blockedByIds) } },
        { isDemo: false },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit * 3, // Fetch more to allow random selection
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
      _count: { select: { reactions: true, comments: true } },
      audioTrack: { select: { id: true, title: true, artistName: true, audioUrl: true, status: true } },
    },
  });

  // Randomly select from the fetched moments
  const shuffled = moments.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, limit);

  return selected.map((m) => ({
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
}

function scoreCandidate(
  candidate: FeedCandidate,
  viewer: ViewerContext,
  scoreData: { score: number; viralScore: number; safetyScore: number; localScore: number } | undefined,
  userQualityScore: number | undefined
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

  // User quality score boost
  if (userQualityScore && userQualityScore > 70) rank += 5;
  if (userQualityScore && userQualityScore > 85) rank += 8;

  // Demo account penalty unless verified
  if (candidate.author.isDemoAccount && !candidate.author.isVerified) rank -= 10;

  // Enhanced new creator boost: authors with fewer moments get a boost to help them grow
  const momentAge = Date.now() - candidate.createdAt.getTime();
  const isNewMoment = momentAge < 7 * 24 * 60 * 60 * 1000; // 7 days
  const isRecentAccount = candidate.author.trustScore > 0 && candidate.author.trustScore < 60; // Newer accounts
  if (isNewMoment && !candidate.author.isDemoAccount && isRecentAccount) {
    rank += 12; // Stronger boost for new content from new real users
  } else if (isNewMoment && !candidate.author.isDemoAccount) {
    rank += 8; // Boost new content from real users
  }

  // Viral boost with DM share emphasis
  if (scoreData) {
    rank += scoreData.viralScore * 0.5;
    rank += scoreData.localScore * 0.8; // Strong local virality boost
  }

  // Personalization boost based on user preferences
  if (candidate.plan) {
    // Mood match
    if (viewer.preferredMoods.includes(candidate.plan.mood)) {
      rank += 15;
    }
    // Budget match
    if (viewer.preferredBudget && candidate.plan.budgetLevel === viewer.preferredBudget) {
      rank += 10;
    }
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

  // Progressive audience testing: only show moments with audienceLevel <= current user's trust level
  // For now, use a simple heuristic based on user role and trust
  const maxAudienceLevel = viewer.role === "ADMIN" || viewer.role === "MODERATOR" ? 10 : 5;

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
      _count: { select: { reactions: true, comments: true } },
      audioTrack: { select: { id: true, title: true, artistName: true, audioUrl: true, status: true } },
    },
  });

  const hasMore = moments.length > candidateLimit;
  const sliced = hasMore ? moments.slice(0, candidateLimit) : moments;

  // Fetch MomentScore for progressive audience testing
  const momentIds = sliced.map((m) => m.id);
  const momentScores = await db.momentScore.findMany({
    where: { momentId: { in: momentIds } },
    select: { momentId: true, audienceLevel: true },
  });
  const audienceLevelMap = new Map(momentScores.map((s) => [s.momentId, s.audienceLevel]));

  // Convert to candidates and apply progressive audience testing
  const candidates: FeedCandidate[] = sliced
    .filter((m) => {
      // Progressive audience testing: only show moments with appropriate audience level
      const audienceLevel = audienceLevelMap.get(m.id) ?? 0;
      return audienceLevel <= maxAudienceLevel;
    })
    .map((m) => ({
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
  const authorIds = Array.from(new Set(candidates.map((c) => c.authorId)));
  const userQualityMap = await fetchUserQualityScores(authorIds);

  // Score each candidate
  for (const c of candidates) {
    const scoreData = scoreMap.get(c.id);
    const userQualityScore = userQualityMap.get(c.authorId);
    c.score = scoreCandidate(c, viewer, scoreData, userQualityScore);
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
  const [blocks, reportedContentIds, userPrefs] = await Promise.all([
    fetchBlockedIds(viewer.userId),
    fetchReportedContentIds(),
    db.user.findUnique({
      where: { id: viewer.userId },
      select: { preferredMoods: true, preferredBudget: true },
    }),
  ]);

  const context: ViewerContext = {
    userId: viewer.userId,
    activeCity: viewer.activeCity,
    countryCode: viewer.countryCode,
    friendIds: new Set(viewer.friendIds),
    followingIds: new Set(viewer.followingIds),
    blockedIds: blocks.blocked,
    blockedByIds: blocks.blockedBy,
    role: viewer.role,
    preferredMoods: userPrefs?.preferredMoods || [],
    preferredBudget: userPrefs?.preferredBudget || null,
  };

  // For for-you scope, blend pools according to percentages
  if (scope === "for-you" && !cursor) {
    const algoCount = Math.ceil(limit * 0.45); // 45% algorithmic
    const cityCount = Math.ceil(limit * 0.20); // 20% city
    const socialCount = Math.ceil(limit * 0.15); // 15% friends/following
    const newCreatorCount = Math.ceil(limit * 0.10); // 10% new creators
    const explorationCount = Math.ceil(limit * 0.10); // 10% exploration

    const [algoPool, cityPool, friendPool, followingPool, newCreatorPool, explorationPool] = await Promise.all([
      fetchCandidates(context, algoCount, "for-you", undefined, since, media).then((r) => r.candidates),
      viewer.activeCity
        ? fetchCandidates(context, cityCount, "city", undefined, since, media).then((r) => r.candidates)
        : Promise.resolve([]),
      fetchCandidates(context, Math.ceil(socialCount / 2), "friends", undefined, since, media).then((r) => r.candidates),
      fetchCandidates(context, Math.ceil(socialCount / 2), "following", undefined, since, media).then((r) => r.candidates),
      fetchNewCreators(context, newCreatorCount),
      fetchExploration(context, explorationCount),
    ]);

    // Combine and deduplicate
    const allCandidates = [
      ...algoPool,
      ...cityPool,
      ...friendPool,
      ...followingPool,
      ...newCreatorPool,
      ...explorationPool,
    ];
    const seenIds = new Set<string>();
    const blended: FeedCandidate[] = [];
    for (const c of allCandidates) {
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id);
        blended.push(c);
      }
    }

    // Score all blended candidates
    const scoreMap = await fetchScoreMap(blended.map((c) => c.id));
    const authorIds = Array.from(new Set(blended.map((c) => c.authorId)));
    const userQualityMap = await fetchUserQualityScores(authorIds);

    for (const c of blended) {
      const scoreData = scoreMap.get(c.id);
      const userQualityScore = userQualityMap.get(c.authorId);
      c.score = scoreCandidate(c, context, scoreData, userQualityScore);
    }

    // Sort by score
    blended.sort((a, b) => b.score - a.score);

    // Apply anti-spam: max 3 per author
    const authorCounts = new Map<string, number>();
    const filtered: FeedCandidate[] = [];
    for (const c of blended) {
      const count = authorCounts.get(c.authorId) ?? 0;
      if (count >= 3) continue;
      authorCounts.set(c.authorId, count + 1);
      filtered.push(c);
    }

    // Return top limit (filter out reported content)
    const result = filtered.slice(0, limit).filter((c) => !reportedContentIds.has(c.id));

    // Filter plan participants visibility
    const planMomentIds = result.filter((c) => c.visibility === "PLAN_PARTICIPANTS" && c.planId).map((c) => c.planId!);
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

    const visibleCandidates = result.filter((c) => {
      if (c.visibility !== "PLAN_PARTICIPANTS" || !c.planId) return true;
      return allowedPlanIds.has(c.planId);
    });

    // Build next cursor
    let nextCursor: string | null = null;
    if (visibleCandidates.length > 0) {
      const last = visibleCandidates[visibleCandidates.length - 1];
      const lastScore = scoreMap.get(last.id)?.score ?? 0;
      nextCursor = Buffer.from(JSON.stringify({ score: lastScore, id: last.id })).toString("base64");
    }

    return { candidates: visibleCandidates, nextCursor };
  }

  // For other scopes, use existing logic
  const { candidates, nextCursor } = await fetchCandidates(context, limit, scope, cursor, since, media);

  // For for-you scope with cursor, try to blend pools if we don't have enough candidates
  let finalCandidates = candidates;
  if (scope === "for-you" && candidates.length < limit && cursor) {
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
    // Check plan visibility
    if (c.visibility === "PLAN_PARTICIPANTS" && c.planId) {
      if (!allowedPlanIds.has(c.planId)) return false;
    }
    // Check if reported
    return !reportedContentIds.has(c.id);
  });

  // Get reacted state
  const momentIds = visibleCandidates.map((c) => c.id);
  const userReactionMap = new Map<string, string>();
  if (momentIds.length > 0) {
    const userReactions = await db.momentReaction.findMany({
      where: { momentId: { in: momentIds }, userId: viewer.userId },
      select: { momentId: true, emoji: true },
    });
    for (const r of userReactions) {
      userReactionMap.set(r.momentId, r.emoji);
    }
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
    _count: { reactions: c._count.reactions, comments: c._count.comments },
    viewerState: {
      likedByMe: userReactionMap.has(c.id),
      myReaction: userReactionMap.get(c.id) || null,
      canDelete: c.authorId === viewer.userId || viewer.role === "ADMIN" || viewer.role === "MODERATOR",
      canReport: c.authorId !== viewer.userId,
    },
  }));

  return { moments, nextCursor };
}
