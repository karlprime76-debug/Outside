import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  try {
    const { city } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get suggested users (official accounts and active users in city)
    const suggestedUsers = await db.user.findMany({
      where: {
        OR: [
          { accountKind: { in: ["OFFICIAL_GUIDE", "OFFICIAL_CITY"] } },
          { activeCity: { name: city }, isAvailable: true },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        accountKind: true,
        isVerified: true,
        isAmbassador: true,
        ambassadorCity: true,
      },
      take: 5,
    });

    // Get ambassadors for this city
    const ambassadors = await db.user.findMany({
      where: {
        isAmbassador: true,
        ambassadorCity: city,
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isVerified: true,
      },
      take: 3,
    });

    // Get city missions
    const missions = await db.cityMission.findMany({
      where: {
        city: city,
        active: true,
      },
      take: 3,
    });

    // Get recent moments in city
    const moments = await db.moment.findMany({
      where: {
        city: city,
        visibility: "PUBLIC",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    // Get free plans in city
    const freePlans = await db.plan.findMany({
      where: {
        city: { name: city },
        budgetLevel: "FREE",
        startDate: { gte: new Date() },
        status: "ACTIVE",
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
      take: 3,
    });

    // Get official tips for city (with global fallback)
    const officialTips = await db.outsideTip.findMany({
      where: {
        OR: [
          { city: city, active: true },
          { city: null, active: true }, // Global fallback
        ],
      },
      take: 3,
    });

    // If no city-specific tips, ensure we have global ones
    let finalTips = officialTips;
    if (officialTips.every((t) => t.city === city) === false && officialTips.length < 3) {
      const globalTips = await db.outsideTip.findMany({
        where: { city: null, active: true },
        take: 3 - officialTips.filter((t) => t.city === city).length,
      });
      finalTips = [...officialTips.filter((t) => t.city === city), ...globalTips];
    }

    return NextResponse.json({
      city,
      suggestedUsers: suggestedUsers.length > 0 ? suggestedUsers : [],
      ambassadors: ambassadors.length > 0 ? ambassadors : [],
      missions: missions.length > 0 ? missions : [],
      moments: moments.length > 0 ? moments : [],
      freePlans: freePlans.length > 0 ? freePlans : [],
      officialTips: finalTips,
      hasContent: suggestedUsers.length > 0 || ambassadors.length > 0 || missions.length > 0 || moments.length > 0 || freePlans.length > 0 || finalTips.length > 0,
    });
  } catch (error) {
    console.error("[STARTER_PACK_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
