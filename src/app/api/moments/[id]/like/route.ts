import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import type { NotificationType } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const existing = await db.momentLike.findUnique({
      where: { momentId_userId: { momentId: id, userId: user.id } },
    });

    if (existing) {
      return NextResponse.json({ liked: true, likesCount: await db.momentLike.count({ where: { momentId: id } }) });
    }

    await db.momentLike.create({
      data: { momentId: id, userId: user.id },
    });

    const likesCount = await db.momentLike.count({ where: { momentId: id } });
    // Notifier l'auteur du moment (sauf si like par soi-même)
    if (moment.authorId !== user.id) {
      await createNotification({
        type: "MOMENT_LIKE" as unknown as NotificationType,
        title: "Nouveau like sur ton moment",
        body: user.name ? `${user.name} a aimé ton moment` : "Quelqu'un a aimé ton moment",
        recipientId: moment.authorId,
        actorId: user.id,
        actorName: user.name || null,
        actorImage: user.image || null,
        data: { momentId: id, userId: user.id, username: user.username || undefined },
      });
    }
    return NextResponse.json({ liked: true, likesCount });
  } catch (error) {
    logError("[MOMENT_ERROR]", "POST /api/moments/[id]/like failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    await db.momentLike.deleteMany({
      where: { momentId: id, userId: user.id },
    });

    const likesCount = await db.momentLike.count({ where: { momentId: id } });
    return NextResponse.json({ liked: false, likesCount });
  } catch (error) {
    logError("[MOMENT_ERROR]", "DELETE /api/moments/[id]/like failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
