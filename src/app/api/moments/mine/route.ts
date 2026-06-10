import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const moments = await db.moment.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        mediaUrl: true,
        caption: true,
        type: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ moments });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
