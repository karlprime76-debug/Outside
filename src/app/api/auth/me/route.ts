import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

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
