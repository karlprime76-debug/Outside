import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const { id } = await params;
    const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    const live = await db.liveSession.findUnique({ where: { id }, select: { hostId: true } });
    if (!live) return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
    if (live.hostId !== user.id && user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const requests = await db.liveRequest.findMany({
      where: { liveId: id, status: "PENDING" },
      include: { user: { select: { id: true, name: true, image: true, username: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[LIST_REQUESTS]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
