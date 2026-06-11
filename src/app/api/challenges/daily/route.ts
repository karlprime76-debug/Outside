import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active daily challenges
    const challenges = await db.dailyChallenge.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    const userProgress = await db.userChallengeProgress.findMany({
      where: { userId: user.id },
    });

    const progressMap = new Map(
      userProgress.map((p) => [p.challengeKey, {
        currentValue: p.currentValue,
        completedAt: p.completedAt
      }])
    );

    const challengesWithProgress = challenges.map((challenge) => {
      const progress = progressMap.get(challenge.key);
      return {
        ...challenge,
        currentValue: progress?.currentValue || 0,
        completed: !!progress?.completedAt,
        completedAt: progress?.completedAt || null,
      };
    });

    return NextResponse.json({ challenges: challengesWithProgress });
  } catch (error) {
    console.error("[DAILY_CHALLENGES_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { challengeKey } = body;

    if (!challengeKey) {
      return NextResponse.json({ error: "Challenge key is required" }, { status: 400 });
    }

    // Check if challenge exists
    const challenge = await db.dailyChallenge.findUnique({
      where: { key: challengeKey },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Create or update progress
    const progress = await db.userChallengeProgress.upsert({
      where: {
        userId_challengeKey: {
          userId: user.id,
          challengeKey,
        },
      },
      create: {
        userId: user.id,
        challengeKey,
        completedAt: new Date(),
      },
      update: {
        completedAt: new Date(),
      },
    });

    // Award badge if this is the first completed challenge
    const userBadges = await db.userBadge.count({ where: { userId: user.id } });
    if (userBadges === 0) {
      // Award "Profil lancé" badge
      const badge = await db.badge.findUnique({ where: { key: "PROFILE_LAUNCHED" } });
      if (badge) {
        await db.userBadge.create({
          data: {
            userId: user.id,
            badgeId: badge.id,
          },
        });
      }
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[DAILY_CHALLENGE_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
