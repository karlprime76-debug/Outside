import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canReceiveMoreFriends } from "@/lib/social/friendship";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

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

  return NextResponse.json({ message: "Vous êtes maintenant amis." });
}
