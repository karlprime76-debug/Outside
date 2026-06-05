import { db } from "@/lib/db";

interface RecordTripHistoryInput {
  userId: string;
  city: string;
  countryCode?: string | null;
  source: "PLAN_JOINED" | "PLAN_CREATED" | "MOMENT_PUBLISHED" | "EVENT_PARTICIPATED" | "TRAVEL_MODE";
  planId?: string;
  eventId?: string;
  momentId?: string;
}

/**
 * Record a trip history entry for the user's passport.
 * Silently fails if data is missing to avoid breaking core flows.
 */
export async function recordTripHistory(input: RecordTripHistoryInput) {
  if (!input.city || input.city.trim().length === 0) return;

  await db.userTripHistory.create({
    data: {
      userId: input.userId,
      city: input.city.trim(),
      countryCode: input.countryCode || null,
      source: input.source,
      planId: input.planId || null,
      eventId: input.eventId || null,
      momentId: input.momentId || null,
    },
  }).catch(() => {
    // Silently fail to avoid breaking core flows
  });
}
