import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
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
