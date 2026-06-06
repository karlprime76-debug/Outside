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
    const { mood, budget } = body;

    const cityId = user.activeCityId;
    const city = user.activeCity?.name;

    if (!cityId || !city) {
      return NextResponse.json({ error: "City not set" }, { status: 400 });
    }

    const now = new Date();
    const tonight = new Date(now);
    tonight.setHours(23, 59, 59, 999);

    // Try to find an existing plan matching criteria
    const whereClause: Record<string, unknown> = {
      cityId: cityId,
      status: "ACTIVE",
      startDate: {
        gte: now,
        lte: tonight,
      },
    };

    if (mood) {
      whereClause.mood = { has: mood };
    }

    if (budget === "free") {
      whereClause.budgetLevel = "FREE";
    }

    const existingPlans = await db.plan.findMany({
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
      take: 3,
    });

    // If we found existing plans, return one randomly
    if (existingPlans.length > 0) {
      const randomIndex = Math.floor(Math.random() * existingPlans.length);
      const selectedPlan = existingPlans[randomIndex];

      return NextResponse.json({
        type: "existing_plan",
        plan: selectedPlan,
        message: "Nous avons trouvé ce plan pour toi ce soir !",
      });
    }

    // If no existing plan, return an official idea or pre-filled plan suggestion
    const officialTips = await db.outsideTip.findMany({
      where: {
        city: city,
        mood: mood || undefined,
        active: true,
      },
      take: 1,
    });

    if (officialTips.length > 0) {
      const tip = officialTips[0];
      return NextResponse.json({
        type: "official_idea",
        idea: {
          title: tip.title,
          description: tip.description,
          actionLabel: tip.actionLabel,
          actionUrl: tip.actionUrl,
        },
        message: "Voici une idée officielle pour ce soir !",
      });
    }

    // If no official tip, suggest creating a plan
    const moodText = mood || "sortie";
    const budgetText = budget === "free" ? "gratuit" : "";

    return NextResponse.json({
      type: "create_suggestion",
      suggestion: {
        title: `Plan mystère ${moodText}`,
        description: budgetText ? `${moodText} ${budgetText} ce soir` : `${moodText} ce soir`,
        mood: mood || "CHILL",
        budgetLevel: budget === "free" ? "FREE" : "MEDIUM",
      },
      message: "Aucun plan ne correspond, crée le tien !",
      actionUrl: "/plans/new",
    });
  } catch (error) {
    console.error("[MYSTERY_PLAN_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
