import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import type { NotificationType } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perfLabel = "[PERF] GET /api/moments/[id]/comments";
  logPerfStart(perfLabel);
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const moment = await db.moment.findUnique({ where: { id } });
    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable." }, { status: 404 });
    }

    const comments = await db.momentComment.findMany({
      where: { momentId: id, isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    logPerfEnd(perfLabel);
    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        user: c.user,
      })),
    });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[MOMENT_ERROR]", "GET /api/moments/[id]/comments failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const perfLabel = "[PERF] POST /api/moments/[id]/comments";
  logPerfStart(perfLabel);
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const moment = await db.moment.findUnique({ where: { id } });
    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const content = String(body.content || "").trim();

    if (!content || content.length > 300) {
      return NextResponse.json(
        { error: "Le commentaire doit faire entre 1 et 300 caractères." },
        { status: 400 }
      );
    }

    const comment = await db.momentComment.create({
      data: {
        momentId: id,
        userId: user.id,
        content,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    // Notifier l'auteur du moment si différent
    if (moment.authorId !== user.id) {
      await createNotification({
        type: "MOMENT_COMMENT" as unknown as NotificationType,
        title: "Nouveau commentaire",
        body: user.name ? `${user.name} a commenté ton moment` : "Quelqu'un a commenté ton moment",
        recipientId: moment.authorId,
        actorId: user.id,
        actorName: user.name || null,
        actorImage: user.image || null,
        data: { momentId: id, userId: user.id, username: user.username || undefined },
      });
    }

    logPerfEnd(perfLabel);
    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: comment.user,
      },
    });
  } catch (error) {
    logPerfEnd(perfLabel);
    logError("[MOMENT_ERROR]", "POST /api/moments/[id]/comments failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
