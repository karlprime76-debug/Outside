import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const countryCode = searchParams.get("countryCode");
    const window = searchParams.get("window") || "24h";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    const blockedIds = await getUserBlockedIds(user.id);

    const now = new Date();
    const windowStart = window === "7d"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const moments = await db.moment.findMany({
      where: {
        visibility: "PUBLIC",
        authorId: { notIn: blockedIds },
        ...(city && { city }),
        ...(countryCode && { countryCode }),
        createdAt: { gte: windowStart },
      },
      include: {
        author: {
          select: {
            id: true, name: true, username: true, image: true, role: true, isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit * 3,
    });

    if (moments.length === 0) {
      return NextResponse.json({ moments: [] });
    }

    const momentIds = moments.map((m) => m.id);
    const [momentScores, reportedMoments] = await Promise.all([
      db.momentScore.findMany({ where: { momentId: { in: momentIds } } }),
      db.report.findMany({
        where: { targetType: "MOMENT", targetId: { in: momentIds }, status: { in: ["PENDING", "REVIEWED"] } },
        select: { targetId: true },
      }),
    ]);

    const scoreMap = new Map(momentScores.map((s) => [s.momentId, s]));
    const reportedSet = new Set(reportedMoments.map((r) => r.targetId).filter(Boolean));

    const scoredMoments = moments
      .filter((m) => !reportedSet.has(m.id))
      .map((moment) => {
        const s = scoreMap.get(moment.id);
        const likes = s?.likes ?? 0;
        const comments = s?.comments ?? 0;
        const shares = s?.shares ?? 0;
        const saves = s?.saves ?? 0;
        const completions = s?.completions ?? 0;
        const views = s?.views ?? 0;
        const reports = s?.reports ?? 0;

        const completionRate = views > 0 ? completions / views : 0;
        const ageHours = (now.getTime() - moment.createdAt.getTime()) / (1000 * 60 * 60);
        const freshnessBoost = Math.max(0, 1 - ageHours / 48);
        const reportPenalty = reports * 20;

        const score =
          (likes * 1) +
          (comments * 3) +
          (shares * 5) +
          (saves * 4) +
          (completionRate * 10) +
          (freshnessBoost * 5) -
          reportPenalty;

        return { moment, score, completionRate, freshnessBoost, reportPenalty };
      })
      .filter((m) => m.score > 0);

    scoredMoments.sort((a, b) => b.score - a.score);

    const authorCount = new Map<string, number>();
    const deduped = scoredMoments.filter((item) => {
      const count = authorCount.get(item.moment.author.id) || 0;
      if (count >= 2) return false;
      authorCount.set(item.moment.author.id, count + 1);
      return true;
    });

    const finalMoments = deduped.slice(0, limit);

    const momentsWithBadges = finalMoments.map(({ moment, score }) => {
      const ageHours = (now.getTime() - moment.createdAt.getTime()) / (1000 * 60 * 60);
      let badge: "Tendance" | "Monte vite" | "Nouveau" | null = null;

      if (ageHours < 6) {
        badge = "Nouveau";
      } else if (score > 50) {
        badge = "Tendance";
      } else if (score > 20) {
        badge = "Monte vite";
      }

      return {
        id: moment.id,
        type: moment.type,
        mediaUrl: moment.mediaUrl,
        caption: moment.caption,
        city: moment.city,
        countryCode: moment.countryCode,
        createdAt: moment.createdAt,
        author: moment.author,
        badge,
        trendingScore: Math.round(score * 100) / 100,
      };
    });

    return NextResponse.json({ moments: momentsWithBadges });
  } catch (error) {
    console.error("[TRENDING]", error);
    return NextResponse.json({ error: "Erreur lors du chargement des tendances" }, { status: 500 });
  }
}
