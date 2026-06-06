import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const FOUNDER_CUTOFF_DATE = new Date("2026-03-01"); // Early access period

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check founder status based on criteria
    const founderStatus = {
      isEarlyAccess: user.createdAt < FOUNDER_CUTOFF_DATE,
      badges: [] as string[],
    };

    if (user.createdAt < FOUNDER_CUTOFF_DATE) {
      founderStatus.badges.push("FOUNDER_MEMBER");
    }

    // Check if first creator (has moments in their city)
    if (user.activeCity) {
      const firstCreator = await db.moment.findFirst({
        where: {
          city: user.activeCity.name,
          authorId: user.id,
        },
        orderBy: { createdAt: "asc" },
      });

      if (firstCreator) {
        const momentCount = await db.moment.count({
          where: {
            city: user.activeCity.name,
            createdAt: { lt: firstCreator.createdAt },
          },
        });
        if (momentCount === 0) {
          founderStatus.badges.push("FIRST_CREATOR");
        }
      }
    }

    // Check if first organizer (has plans in their city)
    if (user.activeCity) {
      const firstOrganizer = await db.plan.findFirst({
        where: {
          city: { name: user.activeCity.name },
          creatorId: user.id,
        },
        orderBy: { createdAt: "asc" },
      });

      if (firstOrganizer) {
        const planCount = await db.plan.count({
          where: {
            city: { name: user.activeCity.name },
            createdAt: { lt: firstOrganizer.createdAt },
          },
        });
        if (planCount === 0) {
          founderStatus.badges.push("FIRST_ORGANIZER");
        }
      }
    }

    // Check circle launched (5+ referrals)
    const referralCount = await db.referralInvite.count({
      where: {
        inviterId: user.id,
        acceptedUserId: { not: null },
      },
    });
    if (referralCount >= 5) {
      founderStatus.badges.push("CIRCLE_LAUNCHED");
    }

    // Fetch existing user badges
    const existingBadges = await db.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
    });

    const existingBadgeKeys = existingBadges.map((ub) => ub.badge.key);

    // Award new badges
    const newBadges = founderStatus.badges.filter(
      (key) => !existingBadgeKeys.includes(key)
    );

    for (const badgeKey of newBadges) {
      const badge = await db.badge.findUnique({
        where: { key: badgeKey },
      });

      if (badge) {
        await db.userBadge.create({
          data: {
            userId: user.id,
            badgeId: badge.id,
            earnedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      founderStatus,
      newBadges,
      allBadges: [...existingBadgeKeys, ...newBadges],
    });
  } catch (error) {
    console.error("[FOUNDER_STATUS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
