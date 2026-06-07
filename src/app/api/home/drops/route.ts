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
    const countryCode = user.countryCode ?? null;

    // Get drops for user's city, country, or global
    const drops = await db.outsideDrop.findMany({
      where: {
        active: true,
        OR: [
          ...(city ? [{ city: city }] : []),
          ...(countryCode ? [{ countryCode: countryCode }] : []),
          { city: null, countryCode: null },
        ],
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: new Date() } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: new Date() } },
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Group drops by type
    const groupedDrops = drops.reduce((acc, drop) => {
      if (!acc[drop.type]) {
        acc[drop.type] = [];
      }
      acc[drop.type].push(drop);
      return acc;
    }, {} as Record<string, typeof drops>);

    return NextResponse.json({
      city,
      drops: groupedDrops,
    });
  } catch (error) {
    console.error("[DROPS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
