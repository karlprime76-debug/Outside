import { NextRequest, NextResponse } from "next/server";
import { searchSpotifyTracks } from "@/lib/audio/spotify";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const tracks = await searchSpotifyTracks(q);
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ error: "Erreur de recherche Spotify" }, { status: 500 });
  }
}
