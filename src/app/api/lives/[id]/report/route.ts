import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
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
      select: { hostId: true },
    });

    if (!live) {
      return NextResponse.json({ error: "Live introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const { reason, details } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length < 2) {
      return NextResponse.json({ error: "Une raison est requise." }, { status: 400 });
    }

    await db.report.create({
      data: {
        reporterId: user.id,
        reportedUserId: live.hostId,
        targetType: "LIVE",
        targetId: id,
        reason: "OTHER",
        description: `${reason}${details ? ` — ${details}` : ""}`,
        status: "OPEN",
      },
    });

    return NextResponse.json({ message: "Signalement envoyé." }, { status: 201 });
  } catch (error) {
    console.error("[LIVE_REPORT]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
