import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMomentScore } from "@/lib/algorithm/moment-score";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // last 30 days

    const moments = await db.moment.findMany({
      where: {
        createdAt: { gte: cutoff },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
      select: { id: true },
    });

    let processed = 0;
    let failed = 0;

    for (const moment of moments) {
      try {
        await calculateMomentScore(moment.id);
        processed++;
      } catch {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
      total: moments.length,
    });
  } catch (error) {
    console.error("[CRON_RECALCULATE_ERROR]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
