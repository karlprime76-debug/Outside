import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStreak, updateStreak } from "@/lib/streak";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const streak = await getStreak(session.user.id);
    return NextResponse.json(streak);
  } catch (error) {
    console.error("[STREAK_GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const streak = await updateStreak(session.user.id);
    return NextResponse.json(streak);
  } catch (error) {
    console.error("[STREAK_POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
