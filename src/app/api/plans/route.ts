import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";
import { createPlanSchema } from "@/lib/validation/schemas";
import { evaluateBadgesAfterPlanCreated } from "@/lib/badges";
import { createPlanReminders } from "@/lib/plan-reminders";
import { generateRecurringPlans } from "@/lib/recurring-plans";
import { recordTripHistory } from "@/lib/passport";
import { PlanVisibility, PlanPriceType } from "@prisma/client";
import { attachHashtagsToPlan } from "@/lib/hashtags/hashtag-service";
import { createNotification } from "@/lib/notifications";

// Haversine formula to calculate distance between two points in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/plans";
  logPerfStart(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const blockedIds = await getUserBlockedIds(user.id);

    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId");
    const mood = searchParams.get("mood");
    const budgetLevel = searchParams.get("budgetLevel");
    const planCategory = searchParams.get("planCategory");
    const isFree = searchParams.get("isFree");
    const priceType = searchParams.get("priceType");
    const filter = searchParams.get("filter");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const travelerFriendly = searchParams.get("travelerFriendly");
    const nearMe = searchParams.get("nearMe");
    const myPlans = searchParams.get("myPlans");
    const search = searchParams.get("search");
    const timeRange = searchParams.get("timeRange");
    const sortBy = searchParams.get("sortBy") || "dateAsc";
    let limit = parseInt(searchParams.get("limit") || "50", 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 50) limit = 50;

    const [currentUser, joinedPlans] = await Promise.all([
      db.user.findUnique({
        where: { id: user.id },
        select: { activeCityId: true, preferredMoods: true, preferredBudget: true },
      }),
      db.planParticipant.findMany({
        where: { userId: user.id, attendance: "GOING" },
        select: { plan: { select: { creatorId: true, mood: true } } },
        take: 20,
        orderBy: { createdAt: "desc" },
      })
    ]);

    const historicCreatorIds = new Set(joinedPlans.map(p => p.plan.creatorId));
    const historicMoods = new Set(joinedPlans.map(p => p.plan.mood));

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

    // Get user's active city location for "near me" filter
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { activeCityId: true },
    });

    let userCityLocation: { latitude: number; longitude: number } | null = null;
    if (currentUser?.activeCityId) {
      const city = await db.city.findUnique({
        where: { id: currentUser.activeCityId },
        select: { latitude: true, longitude: true },
      });
      if (city?.latitude && city?.longitude) {
        userCityLocation = { latitude: city.latitude, longitude: city.longitude };
      }
    }

    const baseWhere: Record<string, unknown> = { status: "ACTIVE" };
    const priceOrConditions: Record<string, unknown>[] = [];
    if (cityId) baseWhere.cityId = cityId;
    if (mood) baseWhere.mood = mood;
    if (budgetLevel) baseWhere.budgetLevel = budgetLevel;
    if (planCategory) baseWhere.planCategory = planCategory;
    if (isFree === "true") {
      priceOrConditions.push(
        { budgetAmount: { equals: 0 } },
        { budgetAmount: null, budgetLevel: "FREE" },
      );
    } else if (isFree === "false") {
      baseWhere.NOT = { budgetAmount: { equals: 0 } };
    }
    if (priceType) {
      baseWhere.priceType = priceType;
    }
    if (filter === "freeToday") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      baseWhere.priceType = "FREE";
      baseWhere.startDate = { gte: todayStart, lte: todayEnd };
      baseWhere.status = { not: "COMPLETED" };
    }
    if (dateFrom || dateTo) {
      baseWhere.startDate = {};
      if (dateFrom) (baseWhere.startDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (baseWhere.startDate as Record<string, unknown>).lte = new Date(dateTo);
    }
    if (timeRange) {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (timeRange === "today") {
        baseWhere.startDate = { gte: now, lte: endOfDay };
      } else if (timeRange === "tonight") {
        const tonightStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0, 0);
        baseWhere.startDate = { gte: tonightStart, lte: endOfDay };
      } else if (timeRange === "weekend") {
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + (6 - now.getDay()));
        saturday.setHours(0, 0, 0, 0);
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        sunday.setHours(23, 59, 59, 999);
        baseWhere.startDate = { gte: saturday, lte: sunday };
      }
      baseWhere.status = { not: "COMPLETED" };
    }
    if (travelerFriendly === "true") baseWhere.isTravelerFriendly = true;
    if (myPlans === "true") {
      baseWhere.creatorId = user.id;
    } else {
      baseWhere.creatorId = { notIn: blockedIds };
    }
    if (search) {
      const searchWhere: Record<string, unknown>[] = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { planCategory: { contains: search, mode: "insensitive" } },
        { mood: { contains: search, mode: "insensitive" } },
        { city: { name: { contains: search, mode: "insensitive" } } },
        { creator: { name: { contains: search, mode: "insensitive" } } },
      ];
      const existingOR = baseWhere.OR as Record<string, unknown>[] | undefined;
      if (existingOR) {
        baseWhere.AND = [{ OR: searchWhere }, ...(baseWhere.AND ? [baseWhere.AND] : [])];
      } else {
        baseWhere.OR = searchWhere;
      }
    }

    // Determine orderBy based on sortBy parameter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { startDate: "asc" };
    let isPopularSort = false;
    const isForYouSort = sortBy === "for-you";

    switch (sortBy) {
      case "for-you":
        orderBy = { startDate: "asc" }; // Initial sort, will be re-ranked in memory
        break;
      case "dateAsc":
        orderBy = { startDate: "asc" };
        break;
      case "priceAsc":
        orderBy = { budgetAmount: { sort: "asc", nulls: "last" } };
        break;
      case "priceDesc":
        orderBy = { budgetAmount: { sort: "desc", nulls: "last" } };
        break;
      case "popular":
        isPopularSort = true;
        orderBy = { createdAt: "desc" };
        break;
      case "recent":
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { startDate: "asc" };
    }

    function visibilityOr(userId: string) {
      return [
        { visibility: PlanVisibility.PUBLIC },
        { creatorId: userId },
        { visibility: PlanVisibility.FRIENDS, creatorId: { in: friendIds } },
        { visibility: PlanVisibility.FRIENDS_OF_FRIENDS, creatorId: { in: fofIds } },
        ...(invitedIds.length > 0 ? [{ id: { in: invitedIds } }] : []),
      ];
    }

    // Near me filter: filter plans within 50km of user's active city location
    if (nearMe === "true" && userCityLocation) {
      const userLat = userCityLocation.latitude;
      const userLng = userCityLocation.longitude;
      const radiusKm = 50;

      // Get all plans first, then filter by distance
      const allPlans = await db.plan.findMany({
        where: {
          AND: [
            baseWhere,
            ...(priceOrConditions.length > 0 ? [{ OR: priceOrConditions }] : []),
            { OR: visibilityOr(user.id) },
          ],
        },
        orderBy,
        take: limit * 2, // Fetch more to account for distance filtering
        include: {
          creator: { select: { id: true, name: true, username: true, image: true, trustScore: true, isVerified: true } },
          city: { select: { id: true, name: true } },
          place: { select: { id: true, name: true } },
          participants: { select: { attendance: true } },
        },
      });

      // Filter by distance using Haversine formula
      const nearbyPlans = allPlans.filter((plan) => {
        if (!plan.latitude || !plan.longitude) return false;
        const distance = calculateDistance(userLat, userLng, plan.latitude, plan.longitude);
        return distance <= radiusKm;
      }).slice(0, limit);

      const plansWithCounts = nearbyPlans.map((plan) => {
        const going = plan.participants.filter((p) => p.attendance === "GOING").length;
        const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
        const safePlan = { ...plan, latitude: undefined, longitude: undefined };
        return {
          ...safePlan,
          _count: { participants: going + maybe, going, maybe },
        };
      });

      logPerfEnd(perfLabel);
      return NextResponse.json({ plans: plansWithCounts });
    }

    const DEMO_GLOBAL = process.env.DEMO_GLOBAL_VISIBILITY === "1" || process.env.DEMO_GLOBAL_VISIBILITY === "true";
    const plans = await db.plan.findMany({
      where: DEMO_GLOBAL
        ? {
            OR: [
              {
                AND: [
                  baseWhere,
                  ...(priceOrConditions.length > 0 ? [{ OR: priceOrConditions }] : []),
                  { OR: visibilityOr(user.id) },
                ],
              },
              // Demo plans visible globally
              { isDemo: true },
            ],
          }
        : {
            AND: [
              baseWhere,
              ...(priceOrConditions.length > 0 ? [{ OR: priceOrConditions }] : []),
              { OR: visibilityOr(user.id) },
            ],
          },
      orderBy,
      take: limit,
      include: {
        creator: { select: { id: true, name: true, username: true, image: true, trustScore: true, isVerified: true } },
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        participants: { select: { attendance: true } },
      },
    });

    const plansWithCounts = plans.map((plan) => {
      const going = plan.participants.filter((p) => p.attendance === "GOING").length;
      const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
      const safePlan = { ...plan, latitude: undefined, longitude: undefined };
      return {
        ...safePlan,
        _count: { participants: going + maybe, going, maybe },
      };
    });

    if (isForYouSort && currentUser) {
      const { getPlanRankingScore } = await import("@/lib/algorithm/plan-ranking");
      const rankingContext = {
        userId: user.id,
        preferredMoods: currentUser.preferredMoods,
        preferredBudget: currentUser.preferredBudget,
        activeCityId: currentUser.activeCityId,
        friendIds: new Set(friendIds),
        fofIds: new Set(fofIds),
        blockedIds: new Set(blockedIds),
        historicCreatorIds,
        historicMoods,
      };

      const plansWithScores = plansWithCounts.map(plan => ({
        ...plan,
        score: getPlanRankingScore({
          id: plan.id,
          creatorId: plan.creatorId,
          mood: plan.mood,
          budgetLevel: plan.budgetLevel,
          cityId: plan.cityId,
          isOfficial: plan.isOfficial,
          startDate: plan.startDate,
          createdAt: plan.createdAt,
          creator: {
            trustScore: plan.creator.trustScore || 0,
            isVerified: plan.creator.isVerified || false,
          },
          participants: plan.participants,
        }, rankingContext)
      }));

      plansWithScores.sort((a, b) => b.score - a.score);
      
      logPerfEnd(perfLabel);
      return NextResponse.json({ plans: plansWithScores.slice(0, limit) });
    }

    if (isPopularSort) {
      plansWithCounts.sort((a, b) => {
        const aTotal = a._count.participants;
        const bTotal = b._count.participants;
        if (bTotal !== aTotal) return bTotal - aTotal;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }

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
    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > 100000) {
      return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Données invalides" },
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
        priceType: (data.priceType ?? (data.bookingUrl ? "TICKETED" : data.budgetIsFrom ? "FROM" : data.budgetLevel === "FREE" ? "FREE" : "PAID")) as PlanPriceType,
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
        isOfficial: (user.role === "PRO" || user.role === "ADMIN") ? (data.isOfficial ?? false) : false,
        bookingUrl: (user.role === "PRO" || user.role === "ADMIN") ? data.bookingUrl : null,
        recurrence: data.recurrence ?? null,
        recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
    });

    // Attach hashtags from description
    attachHashtagsToPlan(plan.id, data.description ?? null, plan.city?.name ?? null, data.countryCode ?? null).catch((err) => {
      console.error("[POST /api/plans] Background task error:", err);
    });

    // Auto-join creator as GOING participant
    await db.planParticipant.create({
      data: { planId: plan.id, userId: user.id, status: "CONFIRMED", attendance: "GOING" },
    });

    createPlanReminders(user.id, plan.id, plan.startDate).catch((err) => { logError("[PLAN_ERROR]", "Failed to create plan reminders", { error: String(err) }); });
    evaluateBadgesAfterPlanCreated(user.id).catch((err) => { logError("[PLAN_ERROR]", "Failed to evaluate badges after plan created", { error: String(err) }); });

    if (data.recurrence) {
      generateRecurringPlans(plan.id, data.recurrence, data.recurrenceEndDate ?? null).catch((err) => { logError("[RECURRING_ERROR]", "Failed to generate recurring plans", { error: String(err) }); });
    }

    if (plan.city?.name) {
      recordTripHistory({
        userId: user.id,
        city: plan.city.name,
        countryCode: data.countryCode,
        source: "PLAN_CREATED",
        planId: plan.id,
      }).catch((err) => { logError("[PLAN_ERROR]", "Failed to record trip history", { error: String(err) }); });
    }

    // Notify friends in the same city
    if (plan.visibility !== "PRIVATE") {
      (async () => {
        try {
          const friends = await db.friendship.findMany({
            where: {
              OR: [{ initiatorId: user.id }, { receiverId: user.id }],
            },
            include: {
              initiator: { select: { id: true, activeCityId: true } },
              receiver: { select: { id: true, activeCityId: true } },
            },
          });

          const friendIdsInCity = friends
            .map((f) => (f.initiatorId === user.id ? f.receiver : f.initiator))
            .filter((friend) => friend.activeCityId === plan.cityId)
            .map((f) => f.id);

          if (friendIdsInCity.length > 0) {
            await Promise.all(
              friendIdsInCity.map((friendId) =>
                createNotification({
                  type: "NEW_PLAN",
                  title: "Nouveau plan dans ta ville",
                  body: `${user.name || "Un ami"} a créé un nouveau plan : "${plan.title}"`,
                  recipientId: friendId,
                  actorId: user.id,
                  actorName: user.name,
                  actorImage: user.image,
                  data: { planId: plan.id, cityId: plan.cityId },
                })
              )
            );
          }
        } catch (err) {
          logError("[PLAN_ERROR]", "Failed to notify friends about new plan", { error: String(err) });
        }
      })();
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("Create plan error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}












