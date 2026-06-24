import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { spotifyTrackId, title, artistName, albumArt, previewUrl, durationMs, externalUrl } = await req.json();
  if (!spotifyTrackId || !title) {
    return NextResponse.json({ error: "spotifyTrackId et title requis" }, { status: 400 });
  }

  try {
    const track = await prisma.audioTrack.create({
      data: {
        title,
        artistName: artistName || "Artiste inconnu",
        sourceType: "SPOTIFY",
        audioUrl: previewUrl || externalUrl || "",
        coverUrl: albumArt || null,
        duration: durationMs ? Math.floor(durationMs / 1000) : null,
        spotifyTrackId,
        rightsConfirmed: true,
        isOfficial: true,
        status: "ACTIVE",
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ track });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
  }
}
