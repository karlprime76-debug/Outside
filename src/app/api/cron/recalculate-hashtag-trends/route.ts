import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Cron job pour recalculer les scores trending des hashtags
 * Protégé par CRON_SECRET
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.NODE_ENV !== "production") console.log("[CRON] Starting hashtag trending recalculation");

    // Récupérer tous les hashtags actifs
    const hashtags = await db.hashtag.findMany({
      where: { isBlocked: false },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const hashtag of hashtags) {
      try {
        // Calculer les stats récentes
        const [recentMoments, recentPlans] = await Promise.all([
          db.momentHashtag.count({
            where: {
              hashtagId: hashtag.id,
              createdAt: { gte: sevenDaysAgo },
            },
          }),
          db.planHashtag.count({
            where: {
              hashtagId: hashtag.id,
              createdAt: { gte: sevenDaysAgo },
            },
          }),
        ]);

        // Récupérer les scores des moments liés
        const momentScores = await db.$queryRaw<Array<{ total_score: bigint }>>`
          SELECT SUM(ms.score) as total_score
          FROM "MomentScore" ms
          JOIN "MomentHashtag" mh ON ms."momentId" = mh."momentId"
          WHERE mh."hashtagId" = ${hashtag.id}
          AND ms."createdAt" >= ${sevenDaysAgo}
        `;

        const totalScore = momentScores[0]?.total_score ? Number(momentScores[0].total_score) : 0;

        // Calcul du trending score global
        // recentUsage * 2 + momentViews * 2 + completions * 4 + shares * 5 + comments * 3 + saves * 3 + freshness - penalties
        const trendingScore = 
          (recentMoments + recentPlans) * 2 +
          totalScore * 0.1 +
          (hashtag.isOfficial ? 50 : 0); // Small boost for official hashtags

        // Calcul du trending score local
        const localTrendingScore = 
          (recentMoments + recentPlans) * 2 +
          totalScore * 0.15 +
          (hashtag.isOfficial ? 30 : 0);

        // Mise à jour du hashtag
        await db.hashtag.update({
          where: { id: hashtag.id },
          data: {
            trendingScore,
            localTrendingScore,
            usageCount: recentMoments + recentPlans,
            momentUsageCount: recentMoments,
            planUsageCount: recentPlans,
          },
        });
      } catch (error) {
        console.error(`[CRON] Error recalculating hashtag ${hashtag.tag}:`, error);
      }
    }

    if (process.env.NODE_ENV !== "production") console.log(`[CRON] Recalculated trending scores for ${hashtags.length} hashtags`);

    return NextResponse.json({
      success: true,
      recalculated: hashtags.length,
    });
  } catch (error) {
    console.error("[CRON HASHTAG_TRENDING ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
