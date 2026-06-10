import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { logError } from "@/lib/log";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const created = await db.plan.findMany({
      where: { creatorId: user.id },
      orderBy: { startDate: "desc" },
      take: 50,
      include: {
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    });

    const joined = await db.planParticipant.findMany({
      where: { userId: user.id },
      include: {
        plan: {
          include: {
            city: { select: { id: true, name: true } },
            place: { select: { id: true, name: true } },
            _count: { select: { participants: true } },
          },
        },
      },
      take: 50,
    });

    const joinedPlans = joined.map((p) => p.plan).filter((p) => p.creatorId !== user.id);

    const all = [...created, ...joinedPlans];
    const unique = Array.from(new Map(all.map((p) => [p.id, p])).values())
      .map((p) => ({ ...p, latitude: undefined, longitude: undefined }));

    return NextResponse.json({ plans: unique });
  } catch (error) {
    logError("[PLAN_ERROR]", "GET /api/plans/my failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
