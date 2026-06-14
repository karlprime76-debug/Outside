import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const { id } = await params;
    const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    const live = await db.liveSession.findUnique({ where: { id }, select: { id: true, hostId: true, status: true } });
    if (!live) return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
    if (live.status !== "LIVE") return NextResponse.json({ error: "Ce live n'est plus actif" }, { status: 400 });
    if (live.hostId === user.id) return NextResponse.json({ error: "Tu es l'hôte" }, { status: 400 });

    const existing = await db.liveRequest.findFirst({
      where: { liveId: id, userId: user.id, status: "PENDING" },
    });
    if (existing) return NextResponse.json({ error: "Demande déjà envoyée" }, { status: 409 });

    const request = await db.liveRequest.create({
      data: { liveId: id, userId: user.id },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    console.error("[REQUEST_JOIN]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
