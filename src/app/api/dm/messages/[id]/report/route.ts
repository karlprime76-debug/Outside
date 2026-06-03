import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    const { id } = await params;

    const msg = await db.directMessage.findUnique({ where: { id } });
    if (!msg) return NextResponse.json({ error: "Message introuvable." }, { status: 404 });

    await db.report.create({
      data: {
        reporterId: user.id,
        targetType: "DIRECT_MESSAGE",
        targetId: msg.id,
        reason: "INAPPROPRIATE_CONTENT",
      },
    });

    return NextResponse.json({ message: "Signalement enregistré." });
  } catch (e) {
    console.error("DM report POST error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
