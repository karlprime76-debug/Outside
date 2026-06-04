import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { logError } from "@/lib/log";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, p256dh, auth, userAgent } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Subscription invalide." }, { status: 400 });
    }

    await db.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId: user.id, endpoint },
      },
      update: {
        p256dh,
        auth,
        userAgent: userAgent || null,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent || null,
      },
    });

    await db.userSettings.updateMany({
      where: { userId: user.id },
      data: { pushEnabled: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("[PUSH_ERROR]", "POST /api/push/subscribe failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
