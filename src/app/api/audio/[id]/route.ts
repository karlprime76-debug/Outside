import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const track = await db.audioTrack.findUnique({
      where: { id, status: "ACTIVE" },
    });

    if (!track) {
      return NextResponse.json({ error: "Son introuvable" }, { status: 404 });
    }

    let owner = null;
    if (track.ownerId) {
      owner = await db.user.findUnique({
        where: { id: track.ownerId },
        select: { id: true, name: true, username: true, image: true },
      });
    }

    return NextResponse.json({
      track: {
        id: track.id,
        title: track.title,
        artistName: track.artistName,
        audioUrl: track.audioUrl,
        coverUrl: track.coverUrl,
        duration: track.duration,
        usageCount: track.usageCount,
        isOfficial: track.isOfficial,
        isOriginal: track.isOriginal,
        createdAt: track.createdAt.toISOString(),
        owner,
      },
    });
  } catch (error) {
    console.error("Get audio track error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
