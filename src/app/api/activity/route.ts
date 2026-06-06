import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { auth } from "@/lib/auth";
import { safeJsonParse } from "@/lib/json-parse";

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/activity";
  logPerfStart(perfLabel);
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = 30;

    const [activities, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { recipientId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
      }),
      db.notification.count({
        where: { recipientId: session.user.id, isRead: false },
      }),
    ]);

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const result = items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      isRead: n.isRead,
      actorName: n.actorName,
      actorImage: n.actorImage,
      actorId: n.actorId,
      data: safeJsonParse(n.data),
    }));

    logPerfEnd(perfLabel);
    return NextResponse.json({ activities: result, unreadCount, nextCursor });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[NOTIFICATION_ERROR]", "GET /api/activity failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
