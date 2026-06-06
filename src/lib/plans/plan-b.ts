import { db } from "@/lib/db";

export async function getPlanBOptions(planId: string) {
  // Get the original plan
  const originalPlan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      creator: { select: { id: true, activeCityId: true } },
      city: { select: { id: true, name: true } },
    },
  });

  if (!originalPlan) {
    return { plans: [], places: [], users: [], moments: [] };
  }

  const cityId = originalPlan.cityId;
  const mood = originalPlan.mood;
  const planCategory = originalPlan.planCategory;

  // Get similar plans in the same city
  const similarPlans = await db.plan.findMany({
    where: {
      id: { not: planId },
      cityId,
      status: "ACTIVE",
      visibility: "PUBLIC",
      OR: [
        { mood },
        { planCategory },
      ],
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      city: { select: { id: true, name: true } },
      place: { select: { id: true, name: true } },
      participants: { select: { attendance: true } },
    },
    orderBy: { startDate: "asc" },
    take: 10,
  });

  const plansWithCounts = similarPlans.map((plan) => {
    const going = plan.participants.filter((p) => p.attendance === "GOING").length;
    const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
    return {
      ...plan,
      _count: { participants: going + maybe, going, maybe },
    };
  });

  // Get active places in the city
  const places = await db.place.findMany({
    where: {
      cityId,
      isVisible: true,
    },
    include: {
      city: { select: { id: true, name: true } },
    },
    orderBy: { popularityScore: "desc" },
    take: 10,
  });

  // Get users with active outside status in the city
  const users = await db.userOutsideStatus.findMany({
    where: {
      city: originalPlan.city.name,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          activeCity: { select: { name: true } },
        },
      },
    },
    take: 10,
  });

  // Get moments related to the mood or city
  const moments = await db.moment.findMany({
    where: {
      city: originalPlan.city.name,
      ...(mood ? { vibe: mood } : {}),
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
    take: 10,
  });

  // Get free plans as alternatives
  const freePlans = await db.plan.findMany({
    where: {
      id: { not: planId },
      cityId,
      status: "ACTIVE",
      visibility: "PUBLIC",
      budgetLevel: "FREE",
    },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      city: { select: { id: true, name: true } },
      place: { select: { id: true, name: true } },
      participants: { select: { attendance: true } },
    },
    orderBy: { startDate: "asc" },
    take: 5,
  });

  const freePlansWithCounts = freePlans.map((plan) => {
    const going = plan.participants.filter((p) => p.attendance === "GOING").length;
    const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
    return {
      ...plan,
      _count: { participants: going + maybe, going, maybe },
    };
  });

  return {
    plans: plansWithCounts,
    places,
    users: users.map((u) => u.user),
    moments,
    freePlans: freePlansWithCounts,
  };
}
