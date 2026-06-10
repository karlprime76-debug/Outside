import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifyWeeklyRecapReady } from "@/lib/retention-notifications";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    // Security check - only allow cron jobs or admin
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      // For testing, allow authenticated admin users
      const user = await getCurrentUser();
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Find users who have been active in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await db.user.findMany({
      where: {
        lastActiveDate: {
          gte: sevenDaysAgo,
        },
      },
      select: { id: true },
    });

    // Notify each active user about their weekly recap
    for (const user of activeUsers) {
      await notifyWeeklyRecapReady(user.id);
    }

    return NextResponse.json({
      success: true,
      notified: activeUsers.length,
    });
  } catch (error) {
    console.error("[WEEKLY_RECAP_CRON_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
