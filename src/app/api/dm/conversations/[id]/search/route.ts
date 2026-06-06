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
    const q = searchParams.get("q") || "";
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "30", 10), 1), 50);

    if (!q.trim()) {
      return NextResponse.json({ results: [], nextCursor: null });
    }

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

    // Search messages
    const messages = await db.directMessage.findMany({
      where: {
        conversationId,
        isDeleted: false,
        content: {
          contains: q,
          mode: "insensitive",
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const results = messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
      sender: {
        id: m.sender.id,
        name: m.sender.name,
        username: m.sender.username,
        image: m.sender.image,
      },
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[DM_SEARCH_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
