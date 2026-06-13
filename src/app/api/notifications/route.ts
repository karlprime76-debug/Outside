import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { auth } from "@/lib/auth";
import { getUserBlockedIds } from "@/lib/blocks";
import { markNotificationsAsRead } from "@/lib/notifications";
import { safeJsonParse } from "@/lib/json-parse";
import { markNotificationsReadSchema } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/notifications";
  logPerfStart(perfLabel);
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 50);

    const userId = session.user.id;
    const blockedIds = await getUserBlockedIds(userId);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [socialNotifications, newPlans, myPlansActivity, joinedPlans] = await Promise.all([
      db.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      }),
      db.plan.findMany({
        where: {
          cityId: session.user.activeCityId || undefined,
          createdAt: { gte: yesterday },
          creatorId: { not: userId, notIn: blockedIds },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          creator: { select: { id: true, name: true, image: true } },
          city: { select: { name: true } },
        },
      }),
      db.planParticipant.findMany({
        where: { userId, joinedAt: { gte: yesterday } },
        orderBy: { joinedAt: "desc" },
        take: 5,
        include: {
          plan: { select: { id: true, title: true, startDate: true } },
        },
      }),
      db.plan.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          _count: { select: { participants: true } },
        },
      }),
    ]);

    let hasMoreSocial = false;
    let paginatedSocial = socialNotifications;
    if (socialNotifications.length > limit) {
      hasMoreSocial = true;
      paginatedSocial = socialNotifications.slice(0, limit);
    }

    const socialItems = paginatedSocial.map((n) => ({
      id: n.id,
      type: n.type.toLowerCase(),
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      isRead: n.isRead,
      actorName: n.actorName,
      actorImage: n.actorImage,
      data: safeJsonParse(n.data),
    }));

    const virtualItems = [
      ...newPlans.map((p) => ({
        id: `plan-${p.id}`,
        type: "new_plan" as const,
        title: `Nouveau plan : ${p.title}`,
        body: `Par ${p.creator.name || "Quelqu'un"} à ${p.city.name}`,
        createdAt: p.createdAt.toISOString(),
        isRead: true,
        link: `/plans/${p.id}`,
      })),
      ...myPlansActivity.map((p) => ({
        id: `join-${p.planId}`,
        type: "joined" as const,
        title: "Tu as rejoint un plan",
        body: p.plan.title,
        createdAt: p.joinedAt.toISOString(),
        isRead: true,
        link: `/plans/${p.planId}`,
      })),
      ...joinedPlans
        .filter((p) => p._count.participants > 0)
        .map((p) => ({
          id: `activity-${p.id}`,
          type: "activity" as const,
          title: "Activité sur ton plan",
          body: `${p._count.participants} participant(s) sur "${p.title}"`,
          createdAt: p.createdAt.toISOString(),
          isRead: true,
          link: `/plans/${p.id}`,
        })),
    ];

    // Virtual items only appear on first page (no cursor)
    const notifications = cursor
      ? socialItems
      : [...socialItems, ...virtualItems]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const nextCursor = hasMoreSocial ? paginatedSocial[paginatedSocial.length - 1].id : null;

    logPerfEnd(perfLabel);
    return NextResponse.json({ notifications, nextCursor });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[NOTIFICATION_ERROR]", "GET /api/notifications failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const perfLabel = "[PERF] POST /api/notifications";
  logPerfStart(perfLabel);
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = markNotificationsReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    await markNotificationsAsRead(session.user.id, parsed.data.ids ?? undefined);

    logPerfEnd(perfLabel);
    return NextResponse.json({ message: "Notifications marquées comme lues." });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[NOTIFICATION_ERROR]", "POST /api/notifications failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
