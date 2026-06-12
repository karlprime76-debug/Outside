import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
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

    if (live.hostId !== user.id) {
      return NextResponse.json({ error: "Seul l'hôte peut envoyer un heartbeat." }, { status: 403 });
    }

    if (live.status !== "LIVE") {
      return NextResponse.json({ error: "Le live n'est pas en cours." }, { status: 400 });
    }

    await db.liveSession.update({
      where: { id },
      data: { lastHeartbeatAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[HEARTBEAT]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}