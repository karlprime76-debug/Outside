import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { logError } from "@/lib/log";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    const created = await db.plan.findMany({
      where: { creatorId: user.id },
      orderBy: { startDate: "desc" },
      take: 50,
      include: {
        creator: { select: { id: true, name: true, username: true, image: true } },
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    }).then((plans) => plans.map((p) => ({ ...p, latitude: undefined, longitude: undefined })));

    if (scope === "created") {
      return NextResponse.json({ plans: created });
    }

    const joined = await db.planParticipant.findMany({
      where: { userId: user.id },
      include: {
        plan: {
          include: {
            creator: { select: { id: true, name: true, username: true, image: true } },
            city: { select: { id: true, name: true } },
            place: { select: { id: true, name: true } },
            _count: { select: { participants: true } },
          },
        },
      },
      take: 50,
    });

    const joinedPlans = joined.map((p) => p.plan).filter((p) => p.creatorId !== user.id)
      .map((p) => ({ ...p, latitude: undefined, longitude: undefined }));

    const all = [...created, ...joinedPlans];
    const unique = Array.from(new Map(all.map((p) => [p.id, p])).values());

    return NextResponse.json({ plans: unique });
  } catch (error) {
    logError("[PLAN_ERROR]", "GET /api/plans/my failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
