import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRelationshipStatuses } from "@/lib/social/friendship";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase();

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const currentUserId = session.user.id;

    // Exclure soi-même et utilisateurs bloqués
    const blocked = await db.userBlock.findMany({
      where: { OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }] },
      select: { blockerId: true, blockedId: true },
    });
    const blockedIds = new Set(blocked.map((b) => (b.blockerId === currentUserId ? b.blockedId : b.blockerId)));

    const users = await db.user.findMany({
      where: {
        username: { contains: q, mode: "insensitive" },
        NOT: { id: currentUserId },
        id: { notIn: Array.from(blockedIds) },
        userSettings: { privateDiscoveryMode: false },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        activeCity: { select: { name: true } },
        country: true,
      },
      take: 20,
    });

    const userIds = users.map((u) => u.id);
    const relationshipMap = await getRelationshipStatuses(currentUserId, userIds);

    const results = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      image: u.image,
      activeCity: u.activeCity?.name || null,
      country: u.country,
      relationshipStatus: relationshipMap.get(u.id) || "NONE",
    }));

    return NextResponse.json({ users: results });
    } catch (error) {
      console.error("[USERS_SEARCH]", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  }