import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const badges = await db.userBadge.findMany({
      where: { userId: id },
      include: {
        badge: { select: { id: true, name: true, description: true, icon: true } },
      },
      orderBy: { earnedAt: "desc" },
    });

    const formatted = badges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      earnedAt: ub.earnedAt,
    }));

    return NextResponse.json({ badges: formatted });
  } catch (error) {
    console.error("Get user badges error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
