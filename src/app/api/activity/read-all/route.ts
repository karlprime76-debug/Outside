import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markNotificationsAsRead } from "@/lib/notifications";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    await markNotificationsAsRead(session.user.id);

    return NextResponse.json({ message: "Tout marqué comme lu." });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
