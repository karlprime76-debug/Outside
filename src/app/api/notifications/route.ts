import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { auth } from "@/lib/auth";
import { markNotificationsAsRead } from "@/lib/notifications";

export async function GET() {
  const perfLabel = "[PERF] GET /api/notifications";
  logPerfStart(perfLabel);
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [socialNotifications, newPlans, myPlansActivity, joinedPlans] = await Promise.all([
      db.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.plan.findMany({
        where: {
          cityId: session.user.activeCityId || undefined,
          createdAt: { gte: yesterday },
          creatorId: { not: userId },
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

    const socialItems = socialNotifications.map((n) => ({
      id: n.id,
      type: n.type.toLowerCase(),
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      isRead: n.isRead,
      actorName: n.actorName,
      actorImage: n.actorImage,
      data: n.data ? JSON.parse(n.data) : undefined,
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

    const notifications = [...socialItems, ...virtualItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 25);

    logPerfEnd(perfLabel);
    return NextResponse.json({ notifications });
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
    const ids = body.ids as string[] | undefined;

    await markNotificationsAsRead(session.user.id, ids);

    logPerfEnd(perfLabel);
    return NextResponse.json({ message: "Notifications marquées comme lues." });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[NOTIFICATION_ERROR]", "POST /api/notifications failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
