import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const moment = await db.moment.findUnique({ where: { id } });
    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable." }, { status: 404 });
    }

    const isOwner = moment.authorId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    await db.moment.delete({ where: { id } });

    return NextResponse.json({ message: "Moment supprimé." });
  } catch (error) {
    console.error("Delete moment error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
