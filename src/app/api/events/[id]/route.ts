import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const { id } = await params;

    const event = await db.proEvent.findUnique({
      where: { id },
      include: {
        proAccount: { select: { businessName: true } },
      },
    });

    if (!event || event.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[EVENT_DETAIL]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
