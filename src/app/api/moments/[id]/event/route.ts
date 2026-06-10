import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { calculateMomentScore } from "@/lib/algorithm/moment-score";
import type { MomentEventType } from "@prisma/client";

const VALID_EVENT_TYPES: MomentEventType[] = [
  "IMPRESSION",
  "VIEW",
  "COMPLETE_VIEW",
  "REPLAY",
  "LIKE",
  "UNLIKE",
  "COMMENT",
  "SHARE",
  "SHARE_DM",
  "SAVE",
  "PROFILE_OPEN",
  "FOLLOW_FROM_MOMENT",
  "NOT_INTERESTED",
  "SEE_MORE_LIKE_THIS",
  "REPORT",
];

// Rate limit config per event type: [maxEvents, windowMs]
const EVENT_RATE_LIMITS: Record<string, [number, number]> = {
  IMPRESSION: [30, 60000], // 30 impressions per minute
  VIEW: [20, 60000],
  COMPLETE_VIEW: [10, 60000],
  REPLAY: [10, 60000],
  LIKE: [30, 60000],
  UNLIKE: [30, 60000],
  COMMENT: [20, 60000],
  SHARE: [20, 60000],
  SAVE: [20, 60000],
  PROFILE_OPEN: [20, 60000],
  FOLLOW_FROM_MOMENT: [10, 60000],
  NOT_INTERESTED: [10, 60000],
  REPORT: [5, 60000],
};

// Events that should trigger score recalculation
const SCORE_TRIGGER_EVENTS: MomentEventType[] = [
  "LIKE",
  "UNLIKE",
  "COMMENT",
  "SHARE",
  "SHARE_DM",
  "SAVE",
  "COMPLETE_VIEW",
  "REPLAY",
  "PROFILE_OPEN",
  "FOLLOW_FROM_MOMENT",
  "NOT_INTERESTED",
  "SEE_MORE_LIKE_THIS",
  "REPORT",
];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: momentId } = await params;

  try {
    const body = await req.json();
    const { type, watchMs, percent, source } = body;

    if (!type || !VALID_EVENT_TYPES.includes(type as MomentEventType)) {
      return NextResponse.json({ error: "Type d'événement invalide." }, { status: 400 });
    }

    const eventType = type as MomentEventType;
    const user = await getCurrentUser();
    const userId = user?.id ?? null;

    // Optional auth for impression/view (allow anonymous tracking if app supports public browsing)
    // But require auth for actions that mutate engagement
    const actionEvents: MomentEventType[] = ["LIKE", "UNLIKE", "COMMENT", "SHARE", "SAVE", "FOLLOW_FROM_MOMENT", "NOT_INTERESTED", "REPORT"];
    if (actionEvents.includes(eventType) && !userId) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    // Rate limit per user per moment per event type
    if (userId) {
      const limitConfig = EVENT_RATE_LIMITS[eventType] || [20, 60000];
      const limitKey = `moment_event:${userId}:${momentId}:${eventType}`;
      const limit = await rateLimit(limitKey, limitConfig[0], limitConfig[1]);
      if (!limit.success) {
        // Silently accept but don't store to avoid spam
        return NextResponse.json({ success: true, throttled: true });
      }
    }

    // Verify moment exists
    const moment = await db.moment.findUnique({
      where: { id: momentId },
      select: { id: true, city: true, countryCode: true },
    });
    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable." }, { status: 404 });
    }

    // Store event
    await db.momentEvent.create({
      data: {
        momentId,
        userId,
        type: eventType,
        watchMs: typeof watchMs === "number" ? watchMs : null,
        percent: typeof percent === "number" ? percent : null,
        source: source ?? null,
        city: user?.activeCity?.name ?? moment.city ?? null,
        countryCode: user?.countryCode ?? moment.countryCode ?? null,
      },
    });

    // Recalculate score for important events (fire-and-forget)
    if (SCORE_TRIGGER_EVENTS.includes(eventType)) {
      calculateMomentScore(momentId).catch((err) => { console.error("[MOMENT_ERROR] Failed to calculate moment score:", err); });
    }

    return NextResponse.json({ success: true });
  } catch {
    // Never block the feed if tracking fails
    return NextResponse.json({ success: true });
  }
}
