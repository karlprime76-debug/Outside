import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canSendDirectMessage, getOrCreateDirectConversation } from "@/lib/dm";
import { createNotification } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { calculateMomentScore } from "@/lib/algorithm/moment-score";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const momentId: string | undefined = body.momentId;
    const conversationIds: string[] = Array.isArray(body.conversationIds) ? body.conversationIds : [];
    const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];

    if (!momentId) {
      return NextResponse.json({ error: "Moment requis." }, { status: 400 });
    }

    // Verify moment exists and is visible
    const moment = await db.moment.findUnique({
      where: { id: momentId },
      select: { id: true, mediaUrl: true, caption: true, authorId: true, visibility: true },
    });
    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable." }, { status: 404 });
    }

    // Build list of target conversation IDs
    const targetConversationIds: string[] = [...conversationIds];

    // For userIds, create/get conversations
    for (const otherId of userIds) {
      if (otherId === user.id) continue;
      const can = await canSendDirectMessage(user.id, otherId);
      if (!can) continue;
      const conv = await getOrCreateDirectConversation(user.id, otherId);
      if (conv) targetConversationIds.push(conv.id);
    }

    if (targetConversationIds.length === 0) {
      return NextResponse.json({ error: "Aucun destinataire valide." }, { status: 400 });
    }

    const metadata = JSON.stringify({
      mediaUrl: moment.mediaUrl,
      caption: moment.caption,
      authorId: moment.authorId,
    });

    const createdMessages: string[] = [];

    for (const convId of targetConversationIds) {
      // Verify user is participant
      const part = await db.conversationParticipant.findFirst({
        where: { conversationId: convId, userId: user.id },
      });
      if (!part) continue;

      const msg = await db.directMessage.create({
        data: {
          conversationId: convId,
          senderId: user.id,
          type: "MOMENT",
          momentId: moment.id,
          metadata,
          content: moment.caption || "Moment partagé",
        },
      });
      createdMessages.push(msg.id);

      // Update conversation timestamp
      await db.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

      // Notify other participant
      const otherPart = await db.conversationParticipant.findFirst({
        where: { conversationId: convId, userId: { not: user.id } },
      });
      if (otherPart) {
        await createNotification({
          type: NotificationType.DM_MESSAGE,
          title: "Nouveau message",
          body: `${user.name || "Quelqu'un"} t'a partagé un moment`,
          recipientId: otherPart.userId,
          actorId: user.id,
          actorName: user.name || null,
          actorImage: user.image || null,
          data: { conversationId: convId, momentId: moment.id },
        });
      }
    }

    // Track SHARE_DM event and recalculate score (fire-and-forget)
    if (createdMessages.length > 0) {
      db.momentEvent.create({
        data: {
          momentId,
          userId: user.id,
          type: "SHARE_DM",
          city: user.activeCity?.name || null,
          countryCode: user.countryCode || null,
        },
      }).catch(() => {});
      calculateMomentScore(momentId).catch(() => {});
    }

    return NextResponse.json({ success: true, sentCount: createdMessages.length });
  } catch (e) {
    console.error("Share moment error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
