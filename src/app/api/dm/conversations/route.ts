import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canSendDirectMessage, getOrCreateDirectConversation } from "@/lib/dm";

export async function GET(req: Request) {
  const perfLabel = "[PERF] GET /api/dm/conversations";
  if (process.env.NODE_ENV !== "production") console.time(perfLabel);

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
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const items = await Promise.all(conversations.map(async (c) => {
      const other = c.participants.find((p) => p.userId !== user.id)?.user;
      const lastMessage = c.messages[0] || null;
      const selfPart = c.participants.find((p) => p.userId === user.id);
      const unread = await db.directMessage.count({
        where: {
          conversationId: c.id,
          senderId: { not: user.id },
          isDeleted: false,
          createdAt: selfPart?.lastReadAt ? { gt: selfPart.lastReadAt } : undefined,
        },
      });
      return {
        id: c.id,
        other,
        lastMessage: lastMessage ? { id: lastMessage.id, content: lastMessage.content, createdAt: lastMessage.createdAt.toISOString(), senderId: lastMessage.senderId, type: lastMessage.type } : null,
        unread,
        updatedAt: c.updatedAt.toISOString(),
      };
    }));

    const nextCursor = conversations.length === limit ? conversations[conversations.length - 1].id : null;

    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    return NextResponse.json({ conversations: items, nextCursor });
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.timeEnd(perfLabel);
    console.error("DM conversations GET error:", e);
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
    console.error("DM conversations POST error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
