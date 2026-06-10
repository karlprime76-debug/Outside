import { db } from "@/lib/db";

export async function createTripHistoryEntry(params: {
  userId: string;
  city: string;
  countryCode?: string | null;
  source: string;
  planId?: string | null;
  momentId?: string | null;
  eventId?: string | null;
}) {
  const { userId, city, countryCode, source, planId, momentId, eventId } = params;

  const entry = await db.userTripHistory.create({
    data: {
      userId,
      city,
      countryCode: countryCode || null,
      source,
      planId: planId || null,
      momentId: momentId || null,
      eventId: eventId || null,
    },
  });

  return entry;
}

export async function recordPlanJoined(userId: string, cityName: string, countryCode: string | null, planId: string) {
  return createTripHistoryEntry({
    userId,
    city: cityName,
    countryCode,
    source: "PLAN_JOINED",
    planId,
  });
}

export async function recordMomentPublished(userId: string, cityName: string, countryCode: string | null, momentId: string) {
  return createTripHistoryEntry({
    userId,
    city: cityName,
    countryCode,
    source: "MOMENT_PUBLISHED",
    momentId,
  });
}

export async function recordPlanCreated(userId: string, cityName: string, countryCode: string | null, planId: string) {
  return createTripHistoryEntry({
    userId,
    city: cityName,
    countryCode,
    source: "PLAN_CREATED",
    planId,
  });
}

export async function recordLiveStarted(userId: string, cityName: string, countryCode: string | null, liveId: string) {
  return createTripHistoryEntry({
    userId,
    city: cityName,
    countryCode,
    source: "LIVE_STARTED",
    planId: liveId,
  });
}

export async function recordEventParticipated(userId: string, cityName: string, countryCode: string | null, eventId: string) {
  return createTripHistoryEntry({
    userId,
    city: cityName,
    countryCode,
    source: "EVENT_PARTICIPATED",
    eventId,
  });
}
