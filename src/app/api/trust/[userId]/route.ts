import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTrustData } from "@/lib/trust";

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const data = await getTrustData(userId);

    return NextResponse.json({
      trustScore: data.trustScore,
      badge: data.badge,
      badgeLabel: data.badgeLabel,
      signals: data.signals,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
