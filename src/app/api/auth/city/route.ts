import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordTripHistory } from "@/lib/passport";

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { activeCityId, travelModeEnabled } = await req.json();

    let cityData: { name: string; countryCode: string | null } | null = null;
    if (activeCityId) {
      const city = await db.city.findUnique({
        where: { id: activeCityId },
        select: { name: true, countryCode: true },
      });
      if (city) cityData = city;
    }

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

    if (cityData && travelModeEnabled === true) {
      recordTripHistory({
        userId: user.id,
        city: cityData.name,
        countryCode: cityData.countryCode,
        source: "TRAVEL_MODE",
      }).catch((err) => { console.error("[PLAN_ERROR] Failed to record trip history:", err); });
    }

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Update city error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
