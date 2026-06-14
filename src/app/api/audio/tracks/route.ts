import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { searchPixabayTracks } from "@/lib/audio/pixabay";

interface TrackResult {
  id: string;
  title: string;
  artistName: string | null;
  audioUrl: string;
  duration: number | null;
  usageCount: number;
  isOfficial: boolean;
  isOriginal: boolean;
  isFromPixabay?: boolean;
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type");
    const cursor = searchParams.get("cursor");
    const source = searchParams.get("source");
    let limit = parseInt(searchParams.get("limit") || "20", 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    const where: Record<string, unknown> = { status: { not: "BLOCKED" } };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { artistName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (type === "official") {
      where.sourceType = { in: ["OUTSIDE_LIBRARY", "ARTIST_UPLOAD"] };
    } else if (type === "original") {
      where.sourceType = { in: ["USER_ORIGINAL", "MOMENT_ORIGINAL"] };
    }

    const dbTracks = await db.audioTrack.findMany({
      where,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        title: true,
        artistName: true,
        audioUrl: true,
        duration: true,
        usageCount: true,
        isOfficial: true,
        isOriginal: true,
      },
    });

    const tracks: TrackResult[] = dbTracks.map((t) => ({ ...t, isFromPixabay: false }));
    const nextCursor = tracks.length === limit ? tracks[tracks.length - 1].id : null;

    if (source === "pixabay" && q && q.length >= 2) {
      const pixabayTracks = await searchPixabayTracks(q, limit);
      const seenKeys = new Set(tracks.map((t) => `${t.title}|${t.artistName}`));

      for (const pt of pixabayTracks) {
        const key = `${pt.title}|${pt.artistName}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          tracks.push({
            id: pt.id,
            title: pt.title,
            artistName: pt.artistName,
            audioUrl: pt.audioUrl,
            duration: pt.duration,
            usageCount: 0,
            isOfficial: true,
            isOriginal: false,
            isFromPixabay: true,
          });
        }
      }
    }

    return NextResponse.json({ tracks, nextCursor });
  } catch (error) {
    console.error("List audio tracks error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
