import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json();
  const { userId } = body;
  const currentUserId = session.user.id;

  if (!userId || userId === currentUserId) {
    return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
  }

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: userId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Tu suis déjà cet utilisateur." }, { status: 409 });
  }

  await db.follow.create({
    data: { followerId: currentUserId, followingId: userId },
  });

  return NextResponse.json({ message: "Utilisateur suivi." });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const currentUserId = session.user.id;

  if (!userId || userId === currentUserId) {
    return NextResponse.json({ error: "Utilisateur invalide." }, { status: 400 });
  }

  await db.follow.deleteMany({
    where: { followerId: currentUserId, followingId: userId },
  });

  return NextResponse.json({ message: "Tu ne suis plus cet utilisateur." });
}
