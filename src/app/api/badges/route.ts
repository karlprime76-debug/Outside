import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const badges = await db.userBadge.findMany({
      where: { userId: user.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });

    return NextResponse.json({ badges });
  } catch (error) {
    console.error("[BADGES_GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
