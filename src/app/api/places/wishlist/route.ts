import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const wishlist = await db.placeWishlist.findMany({
      where: { userId: user.id },
      include: {
        place: {
          include: { city: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error("[WISHLIST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { placeId, note } = body;

    if (!placeId) {
      return NextResponse.json({ error: "placeId requis" }, { status: 400 });
    }

    const existing = await db.placeWishlist.findUnique({
      where: { userId_placeId: { userId: user.id, placeId } },
    });

    if (existing) {
      return NextResponse.json({ wishlist: existing });
    }

    const wishlist = await db.placeWishlist.create({
      data: { userId: user.id, placeId, note },
      include: {
        place: {
          include: { city: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ wishlist }, { status: 201 });
  } catch (error) {
    console.error("[WISHLIST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
