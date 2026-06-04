import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/events";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

  const { searchParams } = new URL(req.url);
  let limit = parseInt(searchParams.get("limit") || "50", 10);
  if (isNaN(limit) || limit < 1) limit = 50;
  if (limit > 50) limit = 50;

  const now = new Date();

  const events = await db.proEvent.findMany({
    where: {
      status: "PUBLISHED",
      startsAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { startsAt: "asc" },
    include: {
      proAccount: { select: { businessName: true } },
    },
    take: limit,
  });

  if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
  return NextResponse.json({ events });
}
