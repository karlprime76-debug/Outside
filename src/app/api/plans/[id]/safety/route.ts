import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { trustedUserId } = body;

  if (!trustedUserId || typeof trustedUserId !== "string") {
    return NextResponse.json({ error: "Contact de confiance requis" }, { status: 400 });
  }

  const plan = await db.plan.findUnique({
    where: { id },
    select: { title: true, startDate: true, city: { select: { name: true } }, place: { select: { name: true } } },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
  }

  const contact = await db.safetyContact.findUnique({
    where: { userId_trustedUserId: { userId: user.id, trustedUserId } },
  });

  if (!contact) {
    return NextResponse.json({ error: "Ce contact n'est pas dans tes contacts de confiance." }, { status: 403 });
  }

  // Delete any existing unsent share for this plan+user
  await db.planSafetyShare.deleteMany({
    where: { userId: user.id, planId: id, returnedAt: null },
  });

  const share = await db.planSafetyShare.create({
    data: {
      userId: user.id,
      planId: id,
      trustedUserId,
      status: "SHARED",
    },
  });

  const locationText = [plan.place?.name, plan.city?.name].filter(Boolean).join(", ") || "lieu non précisé";

  await createNotification({
    type: "SYSTEM",
    title: "Mode sécurité activé",
    body: `${user.name || "Quelqu'un"} a partagé un plan avec toi : "${plan.title}" à ${locationText}.`,
    recipientId: trustedUserId,
    data: { url: `/plans/${id}`, planId: id, type: "SAFETY_SHARE" },
  });

  return NextResponse.json({ share });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  const share = await db.planSafetyShare.findFirst({
    where: { userId: user.id, planId: id, returnedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!share) {
    return NextResponse.json({ error: "Aucun partage actif pour ce plan." }, { status: 404 });
  }

  const now = new Date();

  if (action === "ARRIVED") {
    await db.planSafetyShare.update({
      where: { id: share.id },
      data: { arrivedAt: now, status: "ARRIVED" },
    });

    await createNotification({
      type: "SYSTEM",
      title: "Mode sécurité",
      body: `${user.name || "Ton contact"} est arrivé au plan.`,
      recipientId: share.trustedUserId,
      data: { url: `/plans/${id}`, planId: id, type: "SAFETY_ARRIVED" },
    });

    return NextResponse.json({ success: true, status: "ARRIVED" });
  }

  if (action === "RETURNED") {
    await db.planSafetyShare.update({
      where: { id: share.id },
      data: { returnedAt: now, status: "RETURNED" },
    });

    await createNotification({
      type: "SYSTEM",
      title: "Mode sécurité",
      body: `${user.name || "Ton contact"} est rentré.`,
      recipientId: share.trustedUserId,
      data: { url: `/plans/${id}`, planId: id, type: "SAFETY_RETURNED" },
    });

    return NextResponse.json({ success: true, status: "RETURNED" });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  const { id } = await params;

  const share = await db.planSafetyShare.findFirst({
    where: { userId: user.id, planId: id, returnedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      trustedUser: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ share: share || null });
}
