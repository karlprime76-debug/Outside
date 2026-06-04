import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { sendPushNotification } from "@/lib/push";
import { logError } from "@/lib/log";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    await sendPushNotification(user.id, {
      title: "OUTSIDE",
      body: "Notifications push activées !",
      url: "/settings",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("[PUSH_ERROR]", "POST /api/push/test failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
