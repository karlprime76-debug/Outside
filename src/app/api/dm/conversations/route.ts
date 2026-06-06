import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logError, logPerfEnd, logPerfStart } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { canSendDirectMessage, getOrCreateDirectConversation } from "@/lib/dm";

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/dm/conversations";
  logPerfStart(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 20);

    const conversations = await db.conversation.findMany({
      where: {
        participants: { some: { userId: user.id } },
      },
      orderBy: { updatedAt: "desc" },
      take: limit + 1, // Take one extra to determine if there's a next page
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, image: true, isVerified: true } },
          },
        },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Determine if there's a next page
    let hasNextPage = false;
    let paginatedConversations = conversations;
    if (conversations.length > limit) {
      hasNextPage = true;
      paginatedConversations = conversations.slice(0, limit);
    }

    const items = await Promise.all(paginatedConversations.map(async (c) => {
      const other = c.participants.find((p) => p.userId !== user.id)?.user;
      const lastMessage = c.messages[0] || null;
      const selfPart = c.participants.find((p) => p.userId === user.id);
      
      // Guard against invalid lastReadAt
      const lastReadAt = selfPart?.lastReadAt;
      
      const unread = await db.directMessage.count({
        where: {
          conversationId: c.id,
          senderId: { not: user.id },
          isDeleted: false,
          ...(lastReadAt && { createdAt: { gt: lastReadAt } }),
        },
      });
      
      return {
        id: c.id,
        other,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          createdAt: lastMessage.createdAt.toISOString(),
          senderId: lastMessage.senderId,
          type: lastMessage.type
        } : null,
        unread,
        updatedAt: c.updatedAt.toISOString(),
      };
    }));

    const nextCursor = hasNextPage ? paginatedConversations[paginatedConversations.length - 1].id : null;

    logPerfEnd(perfLabel);
    return NextResponse.json({ conversations: items, nextCursor });
  } catch (e) {
    logPerfEnd(perfLabel);
    logError("[DM_ERROR]", "GET /api/dm/conversations failed", { error: String(e) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userId: string | undefined = body.userId;
    const username: string | undefined = body.username;

    let otherId: string | null = null;
    if (userId) {
      otherId = userId;
    } else if (username) {
      const u = await db.user.findUnique({ where: { username } });
      if (!u) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
      otherId = u.id;
    } else {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    if (!(await canSendDirectMessage(user.id, otherId))) {
      return NextResponse.json({ error: "Cet utilisateur n’accepte pas les messages privés." }, { status: 403 });
    }

    const conv = await getOrCreateDirectConversation(user.id, otherId);
    if (!conv) return NextResponse.json({ error: "Impossible de créer la conversation." }, { status: 500 });

    return NextResponse.json({ conversationId: conv.id });
  } catch (e) {
    logError("[DM_ERROR]", "POST /api/dm/conversations failed", { error: String(e) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
