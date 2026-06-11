import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getGlobalLeaderboard, getFriendsLeaderboard } from "@/lib/gamification";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "global"; // "global" or "friends"

    const leaderboard = scope === "friends" 
      ? await getFriendsLeaderboard(user.id)
      : await getGlobalLeaderboard();

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
