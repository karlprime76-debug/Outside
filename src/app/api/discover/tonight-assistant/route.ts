import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mood, budget, timing } = body;

    const city = user.activeCity?.name;
    const cityId = user.activeCityId;

    if (!city || !cityId) {
      return NextResponse.json({ error: "City not set" }, { status: 400 });
    }

    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(23, 59, 59, 999);

    const weekendStart = new Date(now);
    weekendStart.setDate(now.getDate() + (6 - now.getDay() + 7) % 7);
    weekendStart.setHours(0, 0, 0, 0);

    const weekendEnd = new Date(weekendStart);
    weekendEnd.setDate(weekendEnd.getDate() + 1);
    weekendEnd.setHours(23, 59, 59, 999);

    // Determine date range based on timing
    let startDate = now;
    let endDate = tonight;

    if (timing === "weekend") {
      startDate = weekendStart;
      endDate = weekendEnd;
    }

    // Get recommended plans based on mood and budget
    const whereClause: Record<string, unknown> = {
      cityId: cityId,
      status: "ACTIVE",
      startDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (budget === "free") {
      whereClause.budgetLevel = "FREE";
    }

    if (mood) {
      whereClause.mood = { has: mood };
    }

    const recommendedPlans = await db.plan.findMany({
      where: whereClause,
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
      take: 5,
    });

    // Get available users in city
    const availableUsers = await db.user.findMany({
      where: {
        activeCityId: cityId,
        isAvailable: true,
        id: { not: user.id },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isVerified: true,
        isAmbassador: true,
      },
      take: 5,
    });

    // Get recent moments in city
    const recentMoments = await db.moment.findMany({
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
      take: 5,
    });

    // Get official tips for mood
    const officialTips = await db.outsideTip.findMany({
      where: {
        city: city,
        mood: mood || undefined,
        active: true,
      },
      take: 3,
    });

    // If no content found, suggest actions
    const suggestions = [];
    if (recommendedPlans.length === 0) {
      suggestions.push({
        type: "create_plan",
        title: "Crée un plan express",
        description: `Lance un plan ${mood || "Food"} pour ce soir`,
        actionUrl: "/plans/new",
      });
    }

    if (availableUsers.length === 0) {
      suggestions.push({
        type: "invite_circle",
        title: "Invite ton cercle",
        description: "Ramène tes amis sur OUTSIDE",
        actionUrl: "/invite",
      });
    }

    if (recentMoments.length === 0) {
      suggestions.push({
        type: "starter_pack",
        title: "Voir le Starter Pack",
        description: `Découvre ce qui se passe à ${city}`,
        actionUrl: `/cities/${city}/starter-pack`,
      });
    }

    return NextResponse.json({
      city,
      recommendedPlans,
      availableUsers,
      recentMoments,
      officialTips,
      suggestions,
    });
  } catch (error) {
    console.error("[TONIGHT_ASSISTANT_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
