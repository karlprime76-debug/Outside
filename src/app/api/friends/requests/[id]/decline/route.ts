import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const request = await db.friendRequest.findUnique({ where: { id } });
    if (!request || request.receiverId !== userId) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    await db.friendRequest.update({
      where: { id },
      data: { status: "DECLINED" },
    });

    return NextResponse.json({ message: "Demande refusée." });
  } catch (error) {
    console.error("[FRIEND_DECLINE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
