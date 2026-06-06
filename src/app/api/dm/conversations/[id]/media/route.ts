import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const { id: conversationId } = await context.params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 50);
    const cursor = searchParams.get("cursor");

    // Check if user is participant
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
    }

    const isParticipant = conversation.participants.some((p) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: "Tu n'es pas participant de cette conversation." }, { status: 403 });
    }

    // Build type filter
    let typeFilter: "IMAGE" | "VIDEO" | "AUDIO" | "MOMENT" | "PLAN_INVITE" | undefined = undefined;
    if (type === "images") {
      typeFilter = "IMAGE";
    } else if (type === "videos") {
      typeFilter = "VIDEO";
    } else if (type === "audio") {
      typeFilter = "AUDIO";
    } else if (type === "moments") {
      typeFilter = "MOMENT";
    } else if (type === "plans") {
      typeFilter = "PLAN_INVITE";
    }

    // Fetch media messages
    const messages = await db.directMessage.findMany({
      where: {
        conversationId,
        isDeleted: false,
        ...(typeFilter && { type: typeFilter }),
        ...(type === "all" && {
          type: {
            in: ["IMAGE", "VIDEO", "AUDIO", "MOMENT", "PLAN_INVITE"] as const,
          },
        }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
    });

    // Fetch sender info for all messages
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const senders = await db.user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, name: true, username: true, image: true },
    });
    const senderMap = new Map(senders.map((s) => [s.id, s]));

    const results = messages.map((m) => ({
      id: m.id,
      type: m.type,
      mediaUrl: m.mediaUrl,
      mediaPath: m.mediaPath,
      mediaName: m.mediaName,
      mediaMimeType: m.mediaMimeType,
      mediaSize: m.mediaSize,
      momentId: m.momentId,
      metadata: m.metadata,
      createdAt: m.createdAt.toISOString(),
      sender: senderMap.get(m.senderId) || {
        id: m.senderId,
        name: null,
        username: null,
        image: null,
      },
    }));

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    return NextResponse.json({ results, nextCursor });
  } catch (error) {
    console.error("[DM_MEDIA_HISTORY_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
