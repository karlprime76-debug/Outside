import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
  }

  const { id } = await params;

  const live = await db.liveSession.findUnique({
    where: { id },
    include: {
      host: { select: { id: true, name: true, image: true } },
    },
  });

  if (!live) {
    return NextResponse.json({ error: "Live introuvable." }, { status: 404 });
  }

  return NextResponse.json({ live });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
  }

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
  }

  const live = await db.liveSession.findUnique({
    where: { id },
    select: { hostId: true, status: true },
  });

  if (!live) {
    return NextResponse.json({ error: "Live introuvable." }, { status: 404 });
  }

  const isHost = live.hostId === user.id;
  const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";

  if (!isHost && !isAdmin) {
    return NextResponse.json({ error: "Tu n'as pas le droit de modifier ce live." }, { status: 403 });
  }

  const body = await req.json();
  const { status, title, description, visibility } = body;

  const allowedStatuses = isAdmin ? ["LIVE", "ENDED", "CANCELLED", "BLOCKED"] : ["LIVE", "ENDED", "CANCELLED"];

  if (status && !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Statut non autorisé." }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (visibility !== undefined) updateData.visibility = visibility;
  if (status) {
    updateData.status = status;
    if (status === "LIVE") updateData.startedAt = new Date();
    if (status === "ENDED" || status === "CANCELLED" || status === "BLOCKED") {
      updateData.endedAt = new Date();
    }
  }

  const updated = await db.liveSession.update({
    where: { id },
    data: updateData,
    include: {
      host: { select: { id: true, name: true, image: true } },
    },
  });

  if (status === "LIVE") {
    const friends = await db.friendship.findMany({
      where: { OR: [{ initiatorId: updated.hostId }, { receiverId: updated.hostId }] },
      select: { initiatorId: true, receiverId: true },
    });
    const friendIds = friends.map((f) => (f.initiatorId === updated.hostId ? f.receiverId : f.initiatorId));

    for (const friendId of friendIds) {
      createNotification({
        type: "LIVE_STARTED",
        title: "Live démarré",
        body: `${updated.host.name || "Quelqu'un"} est en live maintenant${updated.city ? ` à ${updated.city}` : ""}`,
        recipientId: friendId,
        actorId: updated.hostId,
        actorName: updated.host.name,
        actorImage: updated.host.image,
        data: { liveId: id },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ live: updated, message: "Live mis à jour." });
}
