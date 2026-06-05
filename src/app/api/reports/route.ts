import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { ReportReason } from "@prisma/client";

const VALID_TARGET_TYPES = [
  "USER",
  "MOMENT",
  "DIRECT_MESSAGE",
  "PLAN",
  "LIVE",
  "COMMENT",
  "AUDIO_TRACK",
] as const;

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const limit = rateLimit(`report:${user.id}`, 5, 60000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Trop de signalements. Réessaie plus tard." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }

    const body = await req.json();
    const { targetType, targetId, reason, description } = body;

    if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) {
      return NextResponse.json({ error: "Type de cible invalide" }, { status: 400 });
    }

    if (!targetId || typeof targetId !== "string") {
      return NextResponse.json({ error: "ID de cible requis" }, { status: 400 });
    }

    if (!reason || !Object.values(ReportReason).includes(reason)) {
      return NextResponse.json({ error: "Raison requise" }, { status: 400 });
    }

    // Anti auto-signalement
    if (targetType === "USER" && targetId === user.id) {
      return NextResponse.json({ error: "Tu ne peux pas te signaler toi-même." }, { status: 400 });
    }

    // Anti-doublon : empêcher un signalement identique dans les 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await db.report.findFirst({
      where: {
        reporterId: user.id,
        targetType,
        targetId,
        createdAt: { gte: yesterday },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Signalement envoyé. Merci de nous aider à garder OUTSIDE sûr." },
        { status: 200 }
      );
    }

    await db.report.create({
      data: {
        reporterId: user.id,
        targetType,
        targetId,
        reason,
        description: description?.trim() || null,
        status: "PENDING",
      },
    });

    // Increment audio track report count
    if (targetType === "AUDIO_TRACK") {
      await db.audioTrack.update({
        where: { id: targetId },
        data: { reportCount: { increment: 1 } },
      });
    }

    return NextResponse.json(
      { message: "Signalement envoyé. Merci de nous aider à garder OUTSIDE sûr." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REPORT_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

