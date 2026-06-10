import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Get stats for the week
    const [momentsPublished, plansJoined, plansCreated, newFollowers, badgesEarned] = await Promise.all([
      db.moment.count({
        where: {
          authorId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      db.planParticipant.count({
        where: {
          userId: user.id,
          joinedAt: { gte: weekStart, lte: weekEnd },
          attendance: { in: ["GOING", "MAYBE"] },
        },
      }),
      db.plan.count({
        where: {
          creatorId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      db.follow.count({
        where: {
          followingId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      db.userBadge.count({
        where: {
          userId: user.id,
          earnedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
    ]);

    // Get badges earned this week
    const badges = await db.userBadge.findMany({
      where: {
        userId: user.id,
        earnedAt: { gte: weekStart, lte: weekEnd },
      },
      include: {
        badge: {
          select: {
            key: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: { earnedAt: "desc" },
    });

    // Get most active city (based on plans joined/created)
    const cityActivity = await db.$queryRaw<Array<{ city: string; count: bigint }>>`
      SELECT
        c.name as city,
        COUNT(DISTINCT p.id) as count
      FROM "Plan" p
      JOIN "City" c ON p."cityId" = c.id
      WHERE (
        p."creatorId" = ${user.id}
        OR EXISTS (
          SELECT 1 FROM "PlanParticipant" pp
          WHERE pp."planId" = p.id
          AND pp."userId" = ${user.id}
          AND pp.attendance IN ('GOING', 'MAYBE')
        )
      )
      AND p."startDate" >= ${weekStart}
      AND p."startDate" <= ${weekEnd}
      GROUP BY c.name
      ORDER BY count DESC
      LIMIT 1
    `;

    const mostActiveCity = cityActivity.length > 0 ? String(cityActivity[0].city) : null;

    // Generate suggestions based on activity
    const suggestions: Array<{ type: string; title: string; description: string }> = [];

    if (momentsPublished === 0) {
      suggestions.push({
        type: "moment",
        title: "Publie ton premier Moment",
        description: "Partage un moment de ta journée avec la communauté",
      });
    }

    if (plansJoined === 0 && plansCreated === 0) {
      suggestions.push({
        type: "plan",
        title: "Rejoins un plan ce soir",
        description: "Trouve une sortie dans ta ville",
      });
    }

    if (newFollowers === 0) {
      suggestions.push({
        type: "social",
        title: "Découvre de nouveaux comptes",
        description: "Suis des personnes intéressantes dans ta ville",
      });
    }

    if (badgesEarned === 0) {
      suggestions.push({
        type: "badge",
        title: "Complète une mission",
        description: "Gagne des badges en participant à la communauté",
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: "explore",
        title: "Continue comme ça !",
        description: "Tu es très actif cette semaine",
      });
    }

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      stats: {
        momentsPublished,
        plansJoined,
        plansCreated,
        newFollowers,
        badgesEarned,
      },
      badgesEarned: badges.map((ub) => ub.badge),
      mostActiveCity,
      suggestions,
    });
  } catch (error) {
    console.error("[WEEKLY_RECAP_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
