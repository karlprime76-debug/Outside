import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const TONIGHT_LIMIT = 5;

export interface GeoScope {
  city: string | null;
  cityId: string | null;
  countryCode: string | null;
  blockedIds: string[];
}

const PLAN_INCLUDE = {
  creator: {
    select: { id: true, name: true, username: true, image: true },
  },
  city: true,
  _count: { select: { participants: true } },
} satisfies Prisma.PlanInclude;

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

async function cityIdsForCountry(countryCode: string): Promise<string[]> {
  const cities = await db.city.findMany({
    where: { countryCode },
    select: { id: true },
  });
  return cities.map((c) => c.id);
}

async function fillFromScopes<T extends { id: string }>(
  fetcher: (cityIds: string[] | null, cityName: string | null) => Promise<T[]>,
  scope: GeoScope,
  limit = TONIGHT_LIMIT
): Promise<T[]> {
  const seen = new Set<string>();
  const results: T[] = [];

  const add = (items: T[]) => {
    for (const item of items) {
      if (seen.has(item.id) || results.length >= limit) continue;
      seen.add(item.id);
      results.push(item);
    }
  };

  if (scope.cityId) {
    add(await fetcher([scope.cityId], scope.city));
  }
  if (results.length < limit && scope.countryCode) {
    const countryCityIds = await cityIdsForCountry(scope.countryCode);
    const filtered = scope.cityId
      ? countryCityIds.filter((id) => id !== scope.cityId)
      : countryCityIds;
    if (filtered.length > 0) {
      add(await fetcher(filtered, null));
    }
  }
  if (results.length < limit) {
    add(await fetcher(null, null));
  }

  return results;
}

export async function fetchRecommendedPlans(scope: GeoScope) {
  const { start, end } = todayRange();
  return fillFromScopes(
    async (cityIds) =>
      db.plan.findMany({
        where: {
          ...(cityIds ? { cityId: { in: cityIds } } : {}),
          startDate: { gte: start, lte: end },
          status: "ACTIVE",
          creatorId: { notIn: scope.blockedIds },
        },
        include: PLAN_INCLUDE,
        orderBy: { startDate: "asc" },
        take: TONIGHT_LIMIT,
      }),
    scope
  );
}

export async function fetchFreePlans(scope: GeoScope) {
  return fillFromScopes(
    async (cityIds) =>
      db.plan.findMany({
        where: {
          ...(cityIds ? { cityId: { in: cityIds } } : {}),
          budgetLevel: "FREE",
          startDate: { gte: new Date() },
          status: "ACTIVE",
          creatorId: { notIn: scope.blockedIds },
        },
        include: PLAN_INCLUDE,
        orderBy: { startDate: "asc" },
        take: TONIGHT_LIMIT,
      }),
    scope
  );
}

export async function fetchExpressPlans(scope: GeoScope) {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return fillFromScopes(
    async (cityIds) =>
      db.plan.findMany({
        where: {
          ...(cityIds ? { cityId: { in: cityIds } } : {}),
          status: "ACTIVE",
          creatorId: { notIn: scope.blockedIds },
          OR: [
            { mood: "TONIGHT" },
            { mood: "NOW" },
            {
              createdAt: { gte: sixHoursAgo },
              startDate: { gte: new Date() },
            },
          ],
        },
        include: PLAN_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: TONIGHT_LIMIT,
      }),
    scope
  );
}

export async function fetchTrendingMoments(scope: GeoScope) {
  const seen = new Set<string>();
  const results: Prisma.MomentGetPayload<{
    include: { author: { select: { id: true; name: true; username: true; image: true } } };
  }>[] = [];

  const add = (
    items: Prisma.MomentGetPayload<{
      include: { author: { select: { id: true; name: true; username: true; image: true } } };
    }>[]
  ) => {
    for (const item of items) {
      if (seen.has(item.id) || results.length >= TONIGHT_LIMIT) continue;
      seen.add(item.id);
      results.push(item);
    }
  };

  if (scope.city) {
    add(
      await db.moment.findMany({
        where: {
          city: scope.city,
          visibility: "PUBLIC",
          authorId: { notIn: scope.blockedIds },
        },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: TONIGHT_LIMIT,
      })
    );
  }

  if (results.length < TONIGHT_LIMIT && scope.countryCode) {
    add(
      await db.moment.findMany({
        where: {
          countryCode: scope.countryCode,
          visibility: "PUBLIC",
          authorId: { notIn: scope.blockedIds },
          ...(scope.city ? { NOT: { city: scope.city } } : {}),
        },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: TONIGHT_LIMIT - results.length,
      })
    );
  }

  if (results.length < TONIGHT_LIMIT) {
    add(
      await db.moment.findMany({
        where: {
          visibility: "PUBLIC",
          authorId: { notIn: scope.blockedIds },
        },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: TONIGHT_LIMIT - results.length,
      })
    );
  }

  return results;
}

export async function fetchSuggestedUsers(scope: GeoScope, userId: string) {
  const seen = new Set<string>([userId, ...scope.blockedIds]);
  const results: Prisma.UserGetPayload<{
    select: {
      id: true;
      name: true;
      username: true;
      image: true;
      isVerified: true;
      accountKind: true;
      isAmbassador: true;
    };
  }>[] = [];

  const add = (
    users: Prisma.UserGetPayload<{
      select: {
        id: true;
        name: true;
        username: true;
        image: true;
        isVerified: true;
        accountKind: true;
        isAmbassador: true;
      };
    }>[]
  ) => {
    for (const u of users) {
      if (!u.username || seen.has(u.id) || results.length >= TONIGHT_LIMIT) continue;
      seen.add(u.id);
      results.push(u);
    }
  };

  const officialSelect = {
    id: true,
    name: true,
    username: true,
    image: true,
    isVerified: true,
    accountKind: true,
    isAmbassador: true,
  } as const;

  if (scope.cityId) {
    add(
      await db.user.findMany({
        where: {
          id: { notIn: Array.from(seen) },
          OR: [
            { accountKind: { in: ["OFFICIAL_GUIDE", "OFFICIAL_CITY"] } },
            { isAmbassador: true },
          ],
          activeCityId: scope.cityId,
        },
        select: officialSelect,
        take: TONIGHT_LIMIT,
      })
    );

    add(
      await db.user.findMany({
        where: {
          id: { notIn: Array.from(seen) },
          activeCityId: scope.cityId,
          isAvailable: true,
          isDemoAccount: false,
          OR: [
            { userSettings: { is: null } },
            { userSettings: { privateDiscoveryMode: false } },
          ],
        },
        select: officialSelect,
        take: TONIGHT_LIMIT - results.length,
      })
    );
  }

  if (results.length < TONIGHT_LIMIT) {
    add(
      await db.user.findMany({
        where: {
          id: { notIn: Array.from(seen) },
          accountKind: { in: ["OFFICIAL_GUIDE", "OFFICIAL_CITY", "OFFICIAL_PARTNER"] },
          isDemoAccount: false,
        },
        select: officialSelect,
        take: TONIGHT_LIMIT - results.length,
      })
    );
  }

  return results;
}

export async function fetchLiveSessions(scope: GeoScope) {
  const seen = new Set<string>();
  const results: Prisma.LiveSessionGetPayload<{
    include: { host: { select: { id: true; name: true; username: true; image: true } } };
  }>[] = [];

  const add = (
    sessions: Prisma.LiveSessionGetPayload<{
      include: { host: { select: { id: true; name: true; username: true; image: true } } };
    }>[]
  ) => {
    for (const s of sessions) {
      if (seen.has(s.id) || results.length >= TONIGHT_LIMIT) continue;
      seen.add(s.id);
      results.push(s);
    }
  };

  const hostInclude = {
    host: { select: { id: true, name: true, username: true, image: true } },
  };

  if (scope.city) {
    add(
      await db.liveSession.findMany({
        where: { status: "LIVE", city: scope.city, hostId: { notIn: scope.blockedIds } },
        include: hostInclude,
        take: TONIGHT_LIMIT,
      })
    );
  }

  if (results.length < TONIGHT_LIMIT) {
    add(
      await db.liveSession.findMany({
        where: { status: "LIVE", hostId: { notIn: scope.blockedIds } },
        include: hostInclude,
        take: TONIGHT_LIMIT - results.length,
      })
    );
  }

  return results;
}

export async function fetchOfficialTips(scope: GeoScope) {
  const tips = await db.outsideTip.findMany({
    where: {
      active: true,
      OR: [
        ...(scope.city ? [{ city: scope.city }] : []),
        ...(scope.countryCode ? [{ countryCode: scope.countryCode }] : []),
        { city: null, countryCode: null },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: TONIGHT_LIMIT,
  });

  return tips.map((tip) => ({
    ...tip,
    actionUrl: tip.actionUrl.replace(/\{city\}/g, scope.city ?? ""),
  }));
}

export const EDITORIAL_TIPS = [
  {
    id: "editorial-free-plan",
    title: "Trouve un plan gratuit ce soir",
    description: "Explore les sorties sans dépenser un centime",
    actionLabel: "Découvrir",
    actionUrl: "/plans?budget=FREE",
    mood: "FREE",
  },
  {
    id: "editorial-place-vibe",
    title: "Publie l'ambiance d'un lieu",
    description: "Partage l'atmosphère d'un spot que tu connais",
    actionLabel: "Publier",
    actionUrl: "/places",
    mood: "CHILL",
  },
  {
    id: "editorial-express",
    title: "Crée un plan express",
    description: "Lance une sortie rapide pour ce soir",
    actionLabel: "Créer",
    actionUrl: "/plans/new?mood=TONIGHT",
    mood: "TONIGHT",
  },
  {
    id: "editorial-invite",
    title: "Invite quelqu'un à sortir",
    description: "Ramène ton cercle sur OUTSIDE",
    actionLabel: "Inviter",
    actionUrl: "/invite",
    mood: null,
  },
] as const;

export async function safeSection<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[HOME_TONIGHT_${label}]`, error);
    return fallback;
  }
}
