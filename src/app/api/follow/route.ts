import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { isBlocked } from "@/lib/social/friendship";
import { calculateMomentScore } from "@/lib/algorithm/moment-score";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let targetId: string | null = null;
  let momentId: string | null = null;
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      targetId = body.userId || null;
      momentId = body.momentId || null;
    }
    if (!targetId) {
      const { searchParams } = new URL(req.url);
      targetId = searchParams.get("userId");
      momentId = searchParams.get("momentId");
    }
  } catch {}

  if (!targetId) {
    return NextResponse.json({ error: "Paramètre manquant." }, { status: 400 });
  }

  const currentUserId = session.user.id;
  if (currentUserId === targetId) {
    return NextResponse.json({ error: "Action impossible." }, { status: 400 });
  }

  if (await isBlocked(currentUserId, targetId)) {
    return NextResponse.json({ error: "Action impossible." }, { status: 403 });
  }

  const target = await db.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, image: true, userSettings: { select: { allowFollowers: true } } },
  });

  if (!target) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

  if (target.userSettings && target.userSettings.allowFollowers === false) {
    return NextResponse.json({ error: "Cet utilisateur n'accepte pas les abonnés." }, { status: 403 });
  }

  await db.follow.upsert({
    where: { followerId_followingId: { followerId: currentUserId, followingId: target.id } },
    create: { followerId: currentUserId, followingId: target.id },
    update: {},
  });

  // Track FOLLOW_FROM_MOMENT event if momentId is provided
  if (momentId) {
    db.momentEvent.create({
      data: {
        momentId,
        userId: currentUserId,
        type: "FOLLOW_FROM_MOMENT",
        city: session.user.activeCity?.name || null,
        countryCode: session.user.countryCode || null,
      },
    }).catch(() => {});
    calculateMomentScore(momentId).catch(() => {});
  }

  if (currentUserId !== target.id) {
    await createNotification({
      type: "FOLLOW",
      title: "Nouvel abonné",
      body: `${session.user.name || "Quelqu'un"} s'est abonné(e) à toi`,
      recipientId: target.id,
      actorId: currentUserId,
      actorName: session.user.name || null,
      actorImage: session.user.image || null,
      data: { username: typeof session.user?.username === 'string' ? session.user.username : undefined, userId: currentUserId },
    });
  }

  return NextResponse.json({ message: "Abonnement confirmé." });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("userId");
  if (!targetId) return NextResponse.json({ error: "Paramètre manquant." }, { status: 400 });

  await db.follow.deleteMany({ where: { followerId: session.user.id, followingId: targetId } });

  return NextResponse.json({ message: "Désabonnement confirmé." });
}

