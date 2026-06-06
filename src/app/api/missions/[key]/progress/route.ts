import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await params;
    const { } = await req.json();

    const mission = await db.cityMission.findUnique({ where: { key } });
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // Find or create progress record - mark as completed when first triggered
    let userProgress = await db.userCityMissionProgress.findUnique({
      where: {
        userId_missionKey: {
          userId: user.id,
          missionKey: key,
        },
      },
    });

    if (!userProgress) {
      userProgress = await db.userCityMissionProgress.create({
        data: {
          userId: user.id,
          missionKey: key,
          completedAt: new Date(),
        },
      });
    }

    return NextResponse.json(userProgress);
  } catch (error) {
    console.error("[MISSION_PROGRESS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
