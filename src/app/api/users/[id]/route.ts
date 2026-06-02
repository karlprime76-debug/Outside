import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        isVerified: true,
        homeCity: { select: { name: true } },
        activeCity: { select: { name: true } },
        neighborhood: true,
        preferredMoods: true,
        preferredBudget: true,
        language: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    let isFriend = false;
    if (currentUser && currentUser.id !== id) {
      const friendship = await db.friendship.findFirst({
        where: {
          OR: [
            { initiatorId: currentUser.id, receiverId: id },
            { initiatorId: id, receiverId: currentUser.id },
          ],
        },
      });
      isFriend = !!friendship;
    }

    return NextResponse.json({ user: { ...user, isFriend } });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
