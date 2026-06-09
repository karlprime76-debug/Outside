import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordTripHistory } from "@/lib/passport";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();

    const prevUser = await db.user.findUnique({
      where: { id: user.id },
      select: { homeCityId: true, activeCityId: true },
    });

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        bio: body.bio !== undefined ? body.bio || null : undefined,
        neighborhood: body.neighborhood !== undefined ? body.neighborhood || null : undefined,
        preferredBudget: body.preferredBudget !== undefined ? body.preferredBudget || null : undefined,
        language: body.language || undefined,
        preferredMoods: body.preferredMoods?.length ? body.preferredMoods : undefined,
        activeCityId: body.activeCityId || undefined,
        homeCityId: body.homeCityId || undefined,
        country: body.country !== undefined ? body.country || undefined : undefined,
        countryCode: body.countryCode !== undefined ? body.countryCode || undefined : undefined,
      },
      include: {
        homeCity: true,
        activeCity: true,
      },
    });

    // Record trip history when changing active city (travel mode)
    if (body.activeCityId && body.activeCityId !== prevUser?.homeCityId && body.activeCityId !== prevUser?.activeCityId) {
      const newCity = updated.activeCity;
      if (newCity?.name) {
        recordTripHistory({
          userId: user.id,
          city: newCity.name,
          countryCode: updated.countryCode || undefined,
          source: "TRAVEL_MODE",
        }).catch(() => {});
      }
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Patch me error:", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await db.user.delete({ where: { id: user.id } });
    return NextResponse.json({ message: "Compte supprimé." });
  } catch (error) {
    console.error("Delete me error:", error);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
