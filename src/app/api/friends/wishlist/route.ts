import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const friendships = await db.friendship.findMany({
      where: {
        OR: [{ initiatorId: user.id }, { receiverId: user.id }],
      },
    });

    const friendIds = friendships.map((f) =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId
    );

    if (friendIds.length === 0) {
      return NextResponse.json({ wishlist: [] });
    }

    const wishlist = await db.placeWishlist.findMany({
      where: { userId: { in: friendIds } },
      include: {
        place: {
          include: { city: { select: { name: true } } },
        },
        user: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ wishlist });
  } catch (error) {
    console.error("[WISHLIST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
