import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const [
      history,
      joinedPlansCount,
      createdPlansCount,
      momentsCount,
      eventsCount,
      uniqueCities,
    ] = await Promise.all([
      db.userTripHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.planParticipant.count({ where: { userId: user.id, status: "CONFIRMED" } }),
      db.plan.count({ where: { creatorId: user.id } }),
      db.moment.count({ where: { authorId: user.id } }),
      // For now, no explicit pro event participation table; default to 0
      Promise.resolve(0),
      db.userTripHistory.groupBy({
        by: ["city"],
        where: { userId: user.id },
        _count: { city: true },
      }),
    ]);

    const citiesExplored = uniqueCities.map((c) => ({
      city: c.city,
      count: c._count.city,
    }));

    return NextResponse.json({
      history,
      stats: {
        joinedPlans: joinedPlansCount,
        createdPlans: createdPlansCount,
        momentsPublished: momentsCount,
        eventsParticipated: eventsCount,
        citiesExplored: uniqueCities.length,
      },
      citiesExplored,
    });
    } catch (error) {
      console.error("[PASSPORT]", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }