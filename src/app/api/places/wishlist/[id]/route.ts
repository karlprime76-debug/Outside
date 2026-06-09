import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await context.params;

    const wishlist = await db.placeWishlist.findUnique({
      where: { id },
    });

    if (!wishlist || wishlist.userId !== user.id) {
      return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    }

    await db.placeWishlist.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WISHLIST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
