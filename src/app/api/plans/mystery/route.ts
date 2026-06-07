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
    let { mood, budget } = body;

    // Validate mood parameter
    const VALID_MOODS = ["CHILL", "ACTIVE", "PARTY", "CULTURE", "SPORT", "FOOD"];
    if (mood && !VALID_MOODS.includes(mood)) {
      mood = undefined;
    }

    // Validate budget parameter
    const VALID_BUDGETS = ["free", "low", "medium", "high"];
    if (budget && !VALID_BUDGETS.includes(budget)) {
      budget = undefined;
    }

    const cityId = user.activeCityId ?? null;
    const city = user.activeCity?.name ?? null;

    if (!cityId || !city) {
      return NextResponse.json({
        error: "Veuillez définir une ville active",
        suggestion: {
          type: "set_city",
          title: "Définir ta ville",
          description: "Complète ton profil pour des plans personalisés",
          actionUrl: "/onboarding",
        },
      }, { status: 400 });
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
      whereClause.mood = mood;
    }

    if (budget === "free" || budget === "low") {
      whereClause.budgetLevel = "FREE";
    } else if (budget === "high") {
      whereClause.budgetLevel = { in: ["EXPENSIVE", "MODERATE"] };
    } else if (budget === "medium") {
      whereClause.budgetLevel = "MODERATE";
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
      take: 5,
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

    // If no exact match, try broader search (same mood, any budget)
    if (mood) {
      const broadPlans = await db.plan.findMany({
        where: {
          cityId: cityId,
          status: "ACTIVE",
          mood: mood,
          startDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
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

      if (broadPlans.length > 0) {
        const randomIndex = Math.floor(Math.random() * broadPlans.length);
        return NextResponse.json({
          type: "existing_plan",
          plan: broadPlans[randomIndex],
          message: "Voici un plan correspondant à ton humeur !",
        });
      }
    }

    // If no existing plan, return an official idea (with city and global fallback)
    const officialTips = await db.outsideTip.findMany({
      where: {
        OR: [
          ...(city ? [{ city: city, mood: mood || undefined, active: true }] : []),
          { city: null, mood: mood || undefined, active: true }, // Global fallback
        ],
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
