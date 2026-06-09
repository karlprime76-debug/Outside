import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
    }

    const lives = await db.liveSession.findMany({
      where: { status: { in: ["REPORTED", "BLOCKED", "LIVE"] } },
      orderBy: { updatedAt: "desc" },
      include: {
        host: { select: { id: true, name: true, email: true } },
      },
      take: 100,
    });

    return NextResponse.json({ lives });
  } catch (error) {
    console.error("[ADMIN_LIVES_GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || !["LIVE", "ENDED", "BLOCKED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const updated = await db.liveSession.update({
      where: { id },
      data: {
        status,
        endedAt: ["ENDED", "CANCELLED", "BLOCKED"].includes(status) ? new Date() : undefined,
      },
      include: {
        host: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ live: updated, message: "Live modéré." });
  } catch (error) {
    console.error("[ADMIN_LIVES_PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}