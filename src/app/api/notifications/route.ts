import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [newPlans, myPlansActivity, joinedPlans] = await Promise.all([
      db.plan.findMany({
        where: {
          cityId: user.activeCityId || undefined,
          createdAt: { gte: yesterday },
          creatorId: { not: user.id },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          creator: { select: { id: true, name: true, image: true } },
          city: { select: { name: true } },
        },
      }),
      db.planParticipant.findMany({
        where: { userId: user.id, joinedAt: { gte: yesterday } },
        orderBy: { joinedAt: "desc" },
        take: 5,
        include: {
          plan: {
            select: { id: true, title: true, startDate: true },
          },
        },
      }),
      db.plan.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          _count: { select: { participants: true } },
        },
      }),
    ]);

    const notifications = [
      ...newPlans.map((p) => ({
        id: `plan-${p.id}`,
        type: "new_plan" as const,
        title: `Nouveau plan : ${p.title}`,
        body: `Par ${p.creator.name || "Quelqu'un"} à ${p.city.name}`,
        createdAt: p.createdAt.toISOString(),
        link: `/plans/${p.id}`,
        read: false,
      })),
      ...myPlansActivity.map((p) => ({
        id: `join-${p.planId}`,
        type: "joined" as const,
        title: "Tu as rejoint un plan",
        body: p.plan.title,
        createdAt: p.joinedAt.toISOString(),
        link: `/plans/${p.planId}`,
        read: false,
      })),
      ...joinedPlans
        .filter((p) => p._count.participants > 0)
        .map((p) => ({
          id: `activity-${p.id}`,
          type: "activity" as const,
          title: "Activité sur ton plan",
          body: `${p._count.participants} participant(s) sur "${p.title}"`,
          createdAt: p.createdAt.toISOString(),
          link: `/plans/${p.id}`,
          read: false,
        })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
