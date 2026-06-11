import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { ChallengeType } from "@prisma/client";
import { GamificationEngine } from "@/lib/gamification-engine";
import { isBlocked } from "@/lib/social/friendship";
import { calculateMomentScore } from "@/lib/algorithm/moment-score";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const followLimit = await rateLimit(`follow:${session.user.id}`, 30, 3600000);
  if (!followLimit.success) {
    return NextResponse.json(
      { error: "Trop d'actions. Réessaie plus tard." },
      { status: 429, headers: getRateLimitHeaders(followLimit) }
    );
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
  } catch (e) {
    console.error("[FOLLOW_PARSE]", e);
  }

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
        city: session.user.activeCity?.name ?? null,
        countryCode: session.user.countryCode ?? null,
      },
    }).catch((err) => {
      console.error("[FOLLOW] Failed to create moment event:", err);
    });
    calculateMomentScore(momentId).catch((err) => {
      console.error("[FOLLOW] Failed to calculate moment score:", err);
    });
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

    GamificationEngine.trackAction(currentUserId, ChallengeType.FOLLOW_FRIEND).catch((err) => {
      console.error("[GAMIFICATION_ERROR]", err);
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

