import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
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

  const contacts = await db.safetyContact.findMany({
    where: { userId: user.id },
    include: {
      trustedUser: { select: { id: true, name: true, image: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
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

  const body = await req.json().catch(() => ({}));
  const { trustedUserId } = body;

  if (!trustedUserId || typeof trustedUserId !== "string") {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  if (trustedUserId === user.id) {
    return NextResponse.json({ error: "Tu ne peux pas t'ajouter toi-même." }, { status: 400 });
  }

  const trusted = await db.user.findUnique({
    where: { id: trustedUserId },
    select: { id: true },
  });

  if (!trusted) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  try {
    const contact = await db.safetyContact.create({
      data: {
        userId: user.id,
        trustedUserId,
      },
    });
    return NextResponse.json({ contact });
  } catch {
    return NextResponse.json({ error: "Ce contact est déjà ajouté." }, { status: 409 });
  }
}
