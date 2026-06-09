import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const perfLabel = "[PERF] GET /api/events";
    if (process.env.NODE_ENV !== "production") console.time(perfLabel);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

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
  } catch (error) {
    console.error("[EVENTS]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
