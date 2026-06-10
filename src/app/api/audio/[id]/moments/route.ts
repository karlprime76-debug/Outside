import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const blockedIds = await getUserBlockedIds(user.id);

    const moments = await db.moment.findMany({
      where: {
        audioTrackId: id,
        visibility: "PUBLIC",
        authorId: { notIn: blockedIds },
      },
      orderBy: { createdAt: "desc" },
      take: 9,
      select: {
        id: true,
        mediaUrl: true,
        caption: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      moments: moments.map((m) => ({
        id: m.id,
        mediaUrl: m.mediaUrl,
        caption: m.caption,
        createdAt: m.createdAt.toISOString(),
        author: m.author,
      })),
    });
  } catch (error) {
    console.error("List moments for audio track error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
