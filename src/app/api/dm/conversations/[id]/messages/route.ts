import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canSendDirectMessage } from "@/lib/dm";
import { createNotification } from "@/lib/notifications";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { NotificationType } from "@prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfLabel = "[PERF] GET /api/dm/conversations/[id]/messages";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    const { id } = await params;

    const part = await db.conversationParticipant.findFirst({ where: { conversationId: id, userId: user.id } });
    if (!part) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 30);

    const messages = await db.directMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        reactions: {
          include: { user: { select: { id: true, name: true, username: true } } },
        },
      },
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        content: m.isDeleted ? null : m.content,
        isDeleted: m.isDeleted,
        createdAt: m.createdAt.toISOString(),
        status: m.status,
        type: m.type,
        momentId: m.momentId,
        mediaUrl: m.mediaUrl,
        mediaPath: m.mediaPath,
        mediaName: m.mediaName,
        mediaMimeType: m.mediaMimeType,
        mediaSize: m.mediaSize,
        metadata: m.metadata,
        reactions: m.reactions.map((r) => ({
          id: r.id,
          emoji: r.emoji,
          userId: r.userId,
          user: r.user,
        })),
      })),
      nextCursor,
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    console.error("DM messages GET error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfLabel = "[PERF] POST /api/dm/conversations/[id]/messages";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    const { id } = await params;

    const part = await db.conversationParticipant.findFirst({ where: { conversationId: id, userId: user.id } });
    if (!part) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

    // Block/permission check vs other participant
    const otherPart = await db.conversationParticipant.findFirst({ where: { conversationId: id, userId: { not: user.id } } });
    if (!otherPart) return NextResponse.json({ error: "Conversation invalide." }, { status: 400 });
    const can = await canSendDirectMessage(user.id, otherPart.userId);
    if (!can) return NextResponse.json({ error: "Cet utilisateur n'accepte pas les messages privés." }, { status: 403 });

    const dmLimit = await rateLimit(`dm:${user.id}`, 30, 60000);
    if (!dmLimit.success) {
      return NextResponse.json(
        { error: "Trop de messages. Réessaie plus tard." },
        { status: 429, headers: getRateLimitHeaders(dmLimit) }
      );
    }

    const body = await req.json().catch(() => ({}));
    const content = (body.content || "").toString().trim();
    const type = body.type || "TEXT";
    const momentId = body.momentId || null;
    const mediaUrl = body.mediaUrl || null;
    const mediaPath = body.mediaPath || null;
    const mediaName = body.mediaName || null;
    const mediaMimeType = body.mediaMimeType || null;
    const mediaSize = typeof body.mediaSize === "number" ? body.mediaSize : null;
    const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

    if (type === "TEXT" && (!content || content.length > 2000)) {
      return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    }

    const msg = await db.directMessage.create({
      data: {
        conversationId: id,
        senderId: user.id,
        content: content || null,
        type,
        momentId,
        mediaUrl,
        mediaPath,
        mediaName,
        mediaMimeType,
        mediaSize,
        metadata,
      },
    });

    await db.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    // Notifier l'autre participant (pas soi-même)
    if (otherPart.userId !== user.id) {
      await createNotification({
        type: NotificationType.DM_MESSAGE,
        title: "Nouveau message",
        body: `${user.name || "Quelqu'un"} t'a envoyé un message`,
        recipientId: otherPart.userId,
        actorId: user.id,
        actorName: user.name || null,
        actorImage: user.image || null,
        data: { conversationId: id, userId: user.id, username: user.username || undefined },
      });
    }

    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    return NextResponse.json({
      message: {
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content,
        isDeleted: msg.isDeleted,
        createdAt: msg.createdAt.toISOString(),
        status: msg.status,
        type: msg.type,
        momentId: msg.momentId,
        mediaUrl: msg.mediaUrl,
        mediaPath: msg.mediaPath,
        mediaName: msg.mediaName,
        mediaMimeType: msg.mediaMimeType,
        mediaSize: msg.mediaSize,
        metadata: msg.metadata,
        reactions: [],
      },
    });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    console.error("DM messages POST error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
