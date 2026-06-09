import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const expected = CRON_SECRET ? `Bearer ${CRON_SECRET}` : undefined;

    if (expected && authHeader !== expected) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const deleted = await db.friendRequest.deleteMany({
      where: {
        status: { in: ["DECLINED", "CANCELLED"] },
        updatedAt: { lt: thirtyDaysAgo },
      },
    });

    // Nettoyer aussi les notifications lues vieilles de 60 jours
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const cleanedNotifications = await db.notification.deleteMany({
      where: {
        isRead: true,
        readAt: { lt: sixtyDaysAgo },
      },
    });

    return NextResponse.json({
      deletedFriendRequests: deleted.count,
      deletedNotifications: cleanedNotifications.count,
    });
    } catch (error) {
      console.error("[CLEANUP_REQUESTS]", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }