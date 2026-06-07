import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const city = user.activeCity?.name ?? null;

    // Get active city missions (filtered by city if available)
    const missions = await db.cityMission.findMany({
      where: {
        active: true,
        ...(city ? { city } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    // Get user's progress
    const userProgress = await db.userCityMissionProgress.findMany({
      where: { userId: user.id },
    });

    const completedKeys = new Set(userProgress.map((p) => p.missionKey));

    const missionsWithProgress = missions.map((mission) => ({
      ...mission,
      completed: completedKeys.has(mission.key),
      completedAt: userProgress.find((p) => p.missionKey === mission.key)?.completedAt,
    }));

    return NextResponse.json({ missions: missionsWithProgress, city });
  } catch (error) {
    console.error("[CITY_MISSIONS_ERROR]", error);
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
    const { missionKey } = body;

    if (!missionKey) {
      return NextResponse.json({ error: "Mission key is required" }, { status: 400 });
    }

    // Check if mission exists
    const mission = await db.cityMission.findUnique({
      where: { key: missionKey },
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // Create or update progress
    const progress = await db.userCityMissionProgress.upsert({
      where: {
        userId_missionKey: {
          userId: user.id,
          missionKey,
        },
      },
      create: {
        userId: user.id,
        missionKey,
        completedAt: new Date(),
      },
      update: {
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[CITY_MISSION_COMPLETE_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
