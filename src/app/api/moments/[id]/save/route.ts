import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { logError } from "@/lib/log";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { id: momentId } = await params;

    const moment = await db.moment.findUnique({
      where: { id: momentId },
      select: { id: true, authorId: true },
    });
    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable." }, { status: 404 });
    }

    const limit = await rateLimit(`moment:save:${user.id}`, 30, 60000);
    if (!limit.success) {
      return NextResponse.json({ error: "Trop de requêtes." }, { status: 429, headers: getRateLimitHeaders(limit) });
    }

    const existing = await db.savedMoment.findUnique({
      where: { userId_momentId: { userId: user.id, momentId } },
    });

    if (existing) {
      await db.savedMoment.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    await db.savedMoment.create({
      data: { userId: user.id, momentId },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    logError("[MOMENT_ERROR]", "Failed to save moment", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}