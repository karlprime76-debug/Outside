import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const countryCode = searchParams.get("countryCode");
    const window = searchParams.get("window") || "24h";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!city && !countryCode) {
      return NextResponse.json({ error: "city or countryCode required" }, { status: 400 });
    }

    // Calculate time window
    const now = new Date();
    const windowStart = window === "24h" 
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch moments with engagement data
    const moments = await db.moment.findMany({
      where: {
        visibility: "PUBLIC",
        ...(city && { city }),
        ...(countryCode && { countryCode }),
        createdAt: { gte: windowStart },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            role: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit * 3, // Fetch more to allow for filtering
    });

    // Get moment scores for all moments
    const momentIds = moments.map((m) => m.id);
    const momentScores = await db.momentScore.findMany({
      where: { momentId: { in: momentIds } },
    });
    const scoreMap = new Map(momentScores.map((s) => [s.momentId, s]));

    // Get reported moment IDs
    const reportedMomentIds = await db.report.findMany({
      where: {
        targetType: "MOMENT",
        status: { in: ["PENDING", "REVIEWED"] },
      },
      select: { targetId: true },
    }).then((reports) => reports.map((r) => r.targetId).filter(Boolean));

    // Filter out reported moments
    const filteredMoments = moments.filter((m) => !reportedMomentIds.includes(m.id));

    // Calculate trending score for each moment
    const scoredMoments = filteredMoments.map((moment) => {
      const likes = moment._count.likes || 0;
      const comments = moment._count.comments || 0;
      
      // Get engagement counts from MomentScore if available
      const scoreData = scoreMap.get(moment.id);
      const shares = scoreData?.shares || 0;
      const saves = scoreData?.saves || 0;
      const completions = scoreData?.completions || 0;
      const views = scoreData?.views || 0;
      
      // Calculate completion rate
      const completionRate = views > 0 ? completions / views : 0;
      
      // Calculate freshness boost (newer content gets boost)
      const ageHours = (now.getTime() - moment.createdAt.getTime()) / (1000 * 60 * 60);
      const freshnessBoost = Math.max(0, 1 - ageHours / 48); // Decays over 48 hours
      
      // Calculate trending score
      const score = 
        (likes * 1) +
        (comments * 3) +
        (shares * 5) +
        (saves * 4) +
        (completionRate * 10) +
        (freshnessBoost * 5);

      return {
        ...moment,
        trendingScore: score,
        completionRate,
        freshnessBoost,
      };
    });

    // Sort by trending score
    scoredMoments.sort((a, b) => b.trendingScore - a.trendingScore);

    // Limit same author (max 2 per author)
    const authorCount = new Map<string, number>();
    const authorFilteredMoments = scoredMoments.filter((moment) => {
      const count = authorCount.get(moment.author.id) || 0;
      if (count >= 2) return false;
      authorCount.set(moment.author.id, count + 1);
      return true;
    });

    // Limit to requested number
    const finalMoments = authorFilteredMoments.slice(0, limit);

    // Determine badge based on score and freshness
    const momentsWithBadges = finalMoments.map((moment) => {
      const ageHours = (now.getTime() - moment.createdAt.getTime()) / (1000 * 60 * 60);
      let badge: "Tendance" | "Monte vite" | "Nouveau" | null = null;
      
      if (ageHours < 6) {
        badge = "Nouveau";
      } else if (moment.trendingScore > 50) {
        badge = "Tendance";
      } else if (moment.trendingScore > 20) {
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
        _count: moment._count,
        badge,
        trendingScore: moment.trendingScore,
      };
    });

    return NextResponse.json({ moments: momentsWithBadges });
  } catch (error) {
    console.error("Error fetching trending moments:", error);
    return NextResponse.json({ error: "Failed to fetch trending moments" }, { status: 500 });
  }
}
