import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAndAwardContributionBadges } from "@/lib/badges";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const awarded = await checkAndAwardContributionBadges(session.user.id);
    return NextResponse.json({ awarded });
  } catch (error) {
    console.error("[BADGES_CHECK]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
