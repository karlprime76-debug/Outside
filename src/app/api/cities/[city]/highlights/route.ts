import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  try {
    const { city } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blockedIds = await getUserBlockedIds(user.id);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get active creators (users who posted moments this week)
    const activeCreators = await db.user.findMany({
      where: {
        id: { notIn: blockedIds },
        userSettings: { privateDiscoveryMode: false },
        moments: {
          some: {
            city: city,
            createdAt: { gte: oneWeekAgo },
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isVerified: true,
        isAmbassador: true,
      },
      take: 5,
    });

    // Get trending moments (most likes this week)
    const trendingMoments = await db.moment.findMany({
      where: {
        city: city,
        visibility: "PUBLIC",
        createdAt: { gte: oneWeekAgo },
        authorId: { notIn: blockedIds },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      take: 5,
    });

    // Get most saved plans
    const savedPlans = await db.plan.findMany({
      where: {
        city: { name: city },
        status: "ACTIVE",
        startDate: { gte: oneWeekAgo },
        creatorId: { notIn: blockedIds },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      take: 5,
    });

    // Get users making the city active (based on participation)
    const activeUsers = await db.user.findMany({
      where: {
        id: { notIn: blockedIds },
        userSettings: { privateDiscoveryMode: false },
        OR: [
          {
            plansCreated: {
              some: {
                city: { name: city },
                createdAt: { gte: oneWeekAgo },
              },
            },
          },
          {
            planParticipants: {
              some: {
                plan: {
                  city: { name: city },
                },
                joinedAt: { gte: oneWeekAgo },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isVerified: true,
        isAmbassador: true,
      },
      take: 5,
    });

    return NextResponse.json({
      city,
      activeCreators,
      trendingMoments,
      savedPlans,
      activeUsers,
    });
  } catch (error) {
    console.error("[HIGHLIGHTS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
