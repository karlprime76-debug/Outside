import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenges = await db.dailyChallenge.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
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
    console.error("[CHALLENGES_GET_ERROR]", error);
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

    if (!challengeKey || typeof challengeKey !== "string") {
      return NextResponse.json({ error: "Challenge key is required" }, { status: 400 });
    }

    const challenge = await db.dailyChallenge.findUnique({
      where: { key: challengeKey },
    });

    if (!challenge || !challenge.active) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const existingProgress = await db.userChallengeProgress.findUnique({
      where: {
        userId_challengeKey: {
          userId: user.id,
          challengeKey,
        },
      },
    });

    if (existingProgress) {
      return NextResponse.json({ error: "Challenge already completed" }, { status: 400 });
    }

    const progress = await db.userChallengeProgress.create({
      data: {
        userId: user.id,
        challengeKey,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ progress }, { status: 201 });
  } catch (error) {
    console.error("[CHALLENGES_POST_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
