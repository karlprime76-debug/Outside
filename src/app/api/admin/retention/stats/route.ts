import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [dropsCount, missionsCount, ambassadorsCount, badgesCount] = await Promise.all([
      db.outsideDrop.count({ where: { active: true } }),
      db.cityMission.count({ where: { active: true } }),
      db.user.count({ where: { isAmbassador: true } }),
      db.userBadge.count(),
    ]);

    return NextResponse.json({
      dropsCount,
      missionsCount,
      ambassadorsCount,
      badgesCount,
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
