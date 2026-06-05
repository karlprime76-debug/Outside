import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { createPlanSchema } from "@/lib/validation/schemas";
import { evaluateBadgesAfterPlanCreated } from "@/lib/badges";
import { PlanVisibility } from "@prisma/client";

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/plans";
  logPerfStart(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId");
    const mood = searchParams.get("mood");
    const budgetLevel = searchParams.get("budgetLevel");
    const planCategory = searchParams.get("planCategory");
    const isFree = searchParams.get("isFree");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const travelerFriendly = searchParams.get("travelerFriendly");
    let limit = parseInt(searchParams.get("limit") || "50", 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 50) limit = 50;

    const friendRows = await db.friendship.findMany({
      where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
      select: { initiatorId: true, receiverId: true },
    });
    const friendIds = friendRows.map((f) =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId
    );

    let fofIds: string[] = [];
    if (friendIds.length > 0) {
      const fofRows = await db.friendship.findMany({
        where: {
          OR: friendIds.flatMap((fid) => [
            { initiatorId: fid },
            { receiverId: fid },
          ]),
        },
        select: { initiatorId: true, receiverId: true },
      });
      fofIds = Array.from(
        new Set(
          fofRows
            .map((f) => (friendIds.includes(f.initiatorId) ? f.receiverId : f.initiatorId))
            .filter((id) => id !== user.id && !friendIds.includes(id))
        )
      );
    }

    const invitedPlanIds = await db.planInvitation.findMany({
      where: { receiverId: user.id, status: { in: ["PENDING", "ACCEPTED"] } },
      select: { planId: true },
    });
    const invitedIds = invitedPlanIds.map((i) => i.planId);

    const baseWhere: Record<string, unknown> = { status: "ACTIVE" };
    if (cityId) baseWhere.cityId = cityId;
    if (mood) baseWhere.mood = mood;
    if (budgetLevel) baseWhere.budgetLevel = budgetLevel;
    if (planCategory) baseWhere.planCategory = planCategory;
    if (isFree === "true") {
      baseWhere.OR = [
        { budgetAmount: { equals: 0 } },
        { budgetAmount: null, budgetLevel: "FREE" },
      ];
    } else if (isFree === "false") {
      baseWhere.AND = { NOT: { budgetAmount: { equals: 0 } } };
    }
    if (dateFrom || dateTo) {
      baseWhere.startDate = {};
      if (dateFrom) (baseWhere.startDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (baseWhere.startDate as Record<string, unknown>).lte = new Date(dateTo);
    }
    if (travelerFriendly === "true") baseWhere.isTravelerFriendly = true;

    const DEMO_GLOBAL = process.env.DEMO_GLOBAL_VISIBILITY === "1" || process.env.DEMO_GLOBAL_VISIBILITY === "true";
    const plans = await db.plan.findMany({
      where: DEMO_GLOBAL
        ? {
            OR: [
              {
                ...baseWhere,
                OR: [
                  { visibility: PlanVisibility.PUBLIC },
                  { creatorId: user.id },
                  { visibility: PlanVisibility.FRIENDS, creatorId: { in: friendIds } },
                  { visibility: PlanVisibility.FRIENDS_OF_FRIENDS, creatorId: { in: fofIds } },
                  ...(invitedIds.length > 0 ? [{ id: { in: invitedIds } }] : []),
                ],
              },
              // Demo plans visible globally
              { isDemo: true },
            ],
          }
        : {
            ...baseWhere,
            OR: [
              { visibility: PlanVisibility.PUBLIC },
              { creatorId: user.id },
              { visibility: PlanVisibility.FRIENDS, creatorId: { in: friendIds } },
              { visibility: PlanVisibility.FRIENDS_OF_FRIENDS, creatorId: { in: fofIds } },
              ...(invitedIds.length > 0 ? [{ id: { in: invitedIds } }] : []),
            ],
          },
      orderBy: { startDate: "asc" },
      take: limit,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        participants: { select: { attendance: true } },
      },
    });

    const plansWithCounts = plans.map((plan) => {
      const going = plan.participants.filter((p) => p.attendance === "GOING").length;
      const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
      return {
        ...plan,
        _count: { participants: going + maybe, going, maybe },
      };
    });

    logPerfEnd(perfLabel);
    return NextResponse.json({ plans: plansWithCounts });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[PLAN_ERROR]", "GET /api/plans failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const plan = await db.plan.create({
      data: {
        title: data.title,
        description: data.description,
        planCategory: data.planCategory,
        mood: data.mood,
        budgetLevel: data.budgetLevel || "MEDIUM",
        budgetAmount: data.budgetAmount ?? undefined,
        budgetCurrency: data.budgetCurrency,
        budgetIsFrom: data.budgetIsFrom,
        estimatedCost: data.estimatedCost,
        cityId: data.cityId,
        countryCode: data.countryCode,
        placeId: data.placeId,
        neighborhood: data.neighborhood,
        latitude: data.latitude,
        longitude: data.longitude,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        maxParticipants: data.maxParticipants,
        visibility: data.visibility,
        isTravelerFriendly: data.isTravelerFriendly,
        safetyLevel: data.safetyLevel,
        rules: data.rules,
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
    });

    evaluateBadgesAfterPlanCreated(user.id).catch(() => {});

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("Create plan error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
