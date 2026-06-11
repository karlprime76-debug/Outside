import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { createNotification } from "@/lib/notifications";
import type { NotificationType } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const { emoji = "❤️" } = await req.json().catch(() => ({}));

    const moment = await db.moment.findUnique({ where: { id } });
    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable." }, { status: 404 });
    }

    const existing = await db.momentReaction.findUnique({
      where: { momentId_userId: { momentId: id, userId: user.id } },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // Toggle off if same emoji
        await db.momentReaction.delete({
          where: { id: existing.id }
        });
        const reactions = await db.momentReaction.findMany({ where: { momentId: id } });
        return NextResponse.json({ reacted: false, reactions });
      } else {
        // Update emoji if different
        await db.momentReaction.update({
          where: { id: existing.id },
          data: { emoji }
        });
        const reactions = await db.momentReaction.findMany({ where: { momentId: id } });
        return NextResponse.json({ reacted: true, reactions });
      }
    }

    await db.momentReaction.create({
      data: { momentId: id, userId: user.id, emoji },
    });

    const reactions = await db.momentReaction.findMany({ where: { momentId: id } });
    
    // Notifier l'auteur du moment (sauf si réaction par soi-même)
    if (moment.authorId !== user.id) {
      await createNotification({
        type: "MOMENT_LIKE" as unknown as NotificationType,
        title: "Nouvelle réaction sur ton moment",
        body: user.name ? `${user.name} a réagi ${emoji} à ton moment` : `Quelqu'un a réagi ${emoji} à ton moment`,
        recipientId: moment.authorId,
        actorId: user.id,
        actorName: user.name || null,
        actorImage: user.image || null,
        data: { momentId: id, userId: user.id, username: user.username || undefined, emoji },
      });
    }

    return NextResponse.json({ reacted: true, reactions });
  } catch (error) {
    logError("[MOMENT_ERROR]", "POST /api/moments/[id]/reaction failed", { error: String(error) });
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

    await db.momentReaction.deleteMany({
      where: { momentId: id, userId: user.id },
    });

    const reactions = await db.momentReaction.findMany({ where: { momentId: id } });
    return NextResponse.json({ reacted: false, reactions });
  } catch (error) {
    logError("[MOMENT_ERROR]", "DELETE /api/moments/[id]/reaction failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
