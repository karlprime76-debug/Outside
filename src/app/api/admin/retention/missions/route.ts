import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const missions = await db.cityMission.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ missions, count: missions.length });
  } catch (error) {
    console.error("[ADMIN_MISSIONS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { key, title, description, city, rewardLabel } = body;

    if (!key || !title) {
      return NextResponse.json({ error: "key and title are required" }, { status: 400 });
    }

    const mission = await db.cityMission.create({
      data: {
        key,
        title,
        description,
        city,
        rewardLabel,
        active: true,
      },
    });

    return NextResponse.json(mission);
  } catch (error) {
    console.error("[ADMIN_CREATE_MISSION_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
