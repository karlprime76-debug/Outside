import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
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
    take: 50,
  });

  return NextResponse.json({ events });
}
