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

    const place = await db.place.findUnique({
      where: { id },
      include: {
        city: true,
        plans: {
          where: { status: "ACTIVE" },
          orderBy: { startDate: "asc" },
          take: 10,
          select: { id: true, title: true, startDate: true, mood: true },
        },
      },
    });

    if (!place) {
      return NextResponse.json({ error: "Lieu introuvable" }, { status: 404 });
    }

    return NextResponse.json({ place });
  } catch (error) {
    console.error("Get place error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
