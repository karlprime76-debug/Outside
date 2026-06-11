import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canReceiveMoreFriends } from "@/lib/social/friendship";
import { createNotification } from "@/lib/notifications";
import { ChallengeType } from "@prisma/client";
import { GamificationEngine } from "@/lib/gamification-engine";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const userName = session.user.name || "Quelqu'un";
    const userImage = session.user.image || null;

    const request = await db.friendRequest.findUnique({
      where: { id },
    });

    if (!request || request.receiverId !== userId) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "Cette demande n'est plus en attente." }, { status: 409 });
    }

    const senderCanAdd = await canReceiveMoreFriends(request.senderId);
    const receiverCanAdd = await canReceiveMoreFriends(request.receiverId);

    if (!senderCanAdd || !receiverCanAdd) {
      await db.friendRequest.update({
        where: { id },
        data: { status: "DECLINED" },
      });
      return NextResponse.json({
        error: "La limite de 5000 amis est atteinte. L'utilisateur peut te suivre.",
        code: "MAX_FRIENDS_REACHED",
      }, { status: 403 });
    }

    await db.$transaction([
      db.friendRequest.update({
        where: { id },
        data: { status: "ACCEPTED" },
      }),
      db.friendship.create({
        data: { initiatorId: request.senderId, receiverId: request.receiverId },
      }),
    ]);

    await createNotification({
      type: "FRIEND_ACCEPTED",
      title: "Demande d'ami acceptée",
      body: `${userName} a accepté ta demande d'ami.`,
      recipientId: request.senderId,
      actorId: userId,
      actorName: userName,
      actorImage: userImage,
    });

    // Both users get progress for ADD_FRIEND
    await Promise.all([
      GamificationEngine.trackAction(userId, ChallengeType.ADD_FRIEND).catch(e => console.error(e)),
      GamificationEngine.trackAction(request.senderId, ChallengeType.ADD_FRIEND).catch(e => console.error(e)),
    ]);

    return NextResponse.json({ message: "Vous êtes maintenant amis." });
  } catch (error) {
    console.error("[FRIEND_ACCEPT]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
