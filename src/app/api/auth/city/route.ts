import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { activeCityId, travelModeEnabled } = await req.json();

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        activeCityId: activeCityId || undefined,
        travelModeEnabled: typeof travelModeEnabled === "boolean" ? travelModeEnabled : undefined,
      },
      select: {
        id: true,
        activeCityId: true,
        homeCityId: true,
        travelModeEnabled: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Update city error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
