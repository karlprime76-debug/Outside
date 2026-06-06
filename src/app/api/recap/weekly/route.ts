import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get moments published this week
    const momentsPublished = await db.moment.count({
      where: {
        authorId: user.id,
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Get plans joined this week
    const plansJoined = await db.planParticipant.count({
      where: {
        userId: user.id,
        joinedAt: { gte: oneWeekAgo },
      },
    });

    // Get plans created this week
    const plansCreated = await db.plan.count({
      where: {
        creatorId: user.id,
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Get new followers this week
    const newFollowers = await db.follow.count({
      where: {
        followingId: user.id,
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Get badges earned this week
    const badgesEarned = await db.userBadge.findMany({
      where: {
        userId: user.id,
        earnedAt: { gte: oneWeekAgo },
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
    });

    // Get most active city
    const cityActivity = await db.plan.groupBy({
      by: ["cityId"],
      where: {
        participants: {
          some: {
            userId: user.id,
            joinedAt: { gte: oneWeekAgo },
          },
        },
      },
      _count: {
        cityId: true,
      },
      orderBy: {
        _count: {
          cityId: "desc",
        },
      },
      take: 1,
    });

    let mostActiveCity = null;
    if (cityActivity.length > 0) {
      const city = await db.city.findUnique({
        where: { id: cityActivity[0].cityId },
      });
      mostActiveCity = city?.name;
    }

    // Get suggestions for next week
    const suggestions = [];
    if (momentsPublished === 0) {
      suggestions.push({
        type: "publish_moment",
        title: "Publie ton premier Moment",
        description: "Partage une sortie avec la communauté",
      });
    }
    if (plansJoined === 0) {
      suggestions.push({
        type: "join_plan",
        title: "Rejoins un plan",
        description: "Trouve une sortie cette semaine",
      });
    }
    if (newFollowers === 0) {
      suggestions.push({
        type: "discover_users",
        title: "Découvre des comptes",
        description: "Suis des personnes intéressantes",
      });
    }

    return NextResponse.json({
      weekStart: oneWeekAgo,
      weekEnd: new Date(),
      stats: {
        momentsPublished,
        plansJoined,
        plansCreated,
        newFollowers,
        badgesEarned: badgesEarned.length,
      },
      badgesEarned,
      mostActiveCity,
      suggestions,
    });
  } catch (error) {
    console.error("[WEEKLY_RECAP_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
