import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    const [user, userSettings, blockedBy] = await Promise.all([
      db.user.findUnique({
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
      }),
      db.userSettings.findUnique({ where: { userId: id }, select: { profileVisibility: true } }),
      currentUser ? db.userBlock.findFirst({ where: { blockerId: id, blockedId: currentUser.id } }) : Promise.resolve(null),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Check if blocked
    if (blockedBy) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    let isFriend = false;
    let isBlocked = false;
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

      // Check if current user blocked this user
      const currentUserBlocks = await db.userBlock.findFirst({
        where: { blockerId: currentUser.id, blockedId: id },
      });
      isBlocked = !!currentUserBlocks;
    }

    // Apply visibility restrictions
    const profileVisibility = userSettings?.profileVisibility || "PUBLIC";
    let profileData: Record<string, unknown> = {
      ...user,
      isFriend,
    };

    if (!currentUser || (currentUser.id !== id && profileVisibility === "PRIVATE" && !isFriend)) {
      // Hide sensitive data from non-friends on private profiles
      profileData = {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        isFriend,
      };
    } else if (!currentUser || (currentUser.id !== id && profileVisibility === "FRIENDS_ONLY" && !isFriend)) {
      // Friends-only visibility
      profileData = {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        isVerified: user.isVerified,
        isFriend,
      };
    }

    return NextResponse.json({ user: profileData, isBlocked });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
