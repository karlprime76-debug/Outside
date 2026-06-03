import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    const { id } = await params;

    const part = await db.conversationParticipant.findFirst({ where: { conversationId: id, userId: user.id } });
    if (!part) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

    await db.conversationParticipant.update({ where: { id: part.id }, data: { lastReadAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DM read POST error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
