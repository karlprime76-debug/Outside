import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  areFriends,
  hasPendingFriendRequest,
  canReceiveMoreFriends,
  isBlocked,
  isFollowing,
} from "@/lib/social/friendship";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json();
  const { username, userId } = body;

  const currentUserId = session.user.id;

  // Résoudre la cible
  let targetUser;
  if (userId) {
    targetUser = await db.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  } else if (username) {
    targetUser = await db.user.findUnique({ where: { username }, select: { id: true, name: true } });
  }

  if (!targetUser) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  const targetId = targetUser.id;

  if (currentUserId === targetId) {
    return NextResponse.json({ error: "Impossible de t'ajouter toi-même." }, { status: 400 });
  }

  if (await isBlocked(currentUserId, targetId)) {
    return NextResponse.json({ error: "Action impossible." }, { status: 403 });
  }

  if (await areFriends(currentUserId, targetId)) {
    return NextResponse.json({ error: "Vous êtes déjà amis." }, { status: 409 });
  }

  if (await hasPendingFriendRequest(currentUserId, targetId)) {
    return NextResponse.json({ error: "Une demande est déjà en attente." }, { status: 409 });
  }

  const senderCanAdd = await canReceiveMoreFriends(currentUserId);
  const receiverCanAdd = await canReceiveMoreFriends(targetId);

  if (!senderCanAdd || !receiverCanAdd) {
    // Créer un follow à la place si pas déjà suivant
    if (!(await isFollowing(currentUserId, targetId))) {
      await db.follow.create({
        data: { followerId: currentUserId, followingId: targetId },
      });
    }
    return NextResponse.json({
      message: "Cet utilisateur a atteint la limite de 5000 amis. Tu le suis maintenant.",
      code: "FOLLOWED",
    });
  }

  await db.friendRequest.create({
    data: { senderId: currentUserId, receiverId: targetId },
  });

  return NextResponse.json({ message: "Demande d'ami envoyée.", code: "REQUEST_SENT" });
}
