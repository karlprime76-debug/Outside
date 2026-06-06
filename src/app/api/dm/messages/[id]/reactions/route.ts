import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const ALLOWED_EMOJIS = ["❤️", "😂", "🔥", "👀", "🙌"];

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const { id: messageId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const emoji = body.emoji;

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Emoji non autorisé." }, { status: 400 });
    }

    // Check if message exists and user is participant
    const message = await db.directMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: "Impossible de réagir à un message supprimé." }, { status: 400 });
    }

    const isParticipant = message.conversation.participants.some((p) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: "Tu n'es pas participant de cette conversation." }, { status: 403 });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await db.directMessageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: user.id,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Toggle: remove reaction if it exists
      await db.directMessageReaction.delete({
        where: { id: existingReaction.id },
      });
      return NextResponse.json({ reacted: false });
    }

    // Add reaction
    const reaction = await db.directMessageReaction.create({
      data: {
        messageId,
        userId: user.id,
        emoji,
      },
    });

    return NextResponse.json({ reacted: true, reaction });
  } catch (error) {
    console.error("[DM_REACTION_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const { id: messageId } = await context.params;
    const { searchParams } = new URL(req.url);
    const emoji = searchParams.get("emoji");

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Emoji non autorisé." }, { status: 400 });
    }

    // Check if user is participant
    const message = await db.directMessage.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
    }

    const isParticipant = message.conversation.participants.some((p) => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: "Tu n'es pas participant de cette conversation." }, { status: 403 });
    }

    // Delete reaction
    await db.directMessageReaction.deleteMany({
      where: {
        messageId,
        userId: user.id,
        emoji,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DM_REACTION_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
