import { NextResponse } from "next/server";
import { searchPixabayTracks } from "@/lib/audio/pixabay";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ tracks: [] });
    }

    const tracks = await searchPixabayTracks(q);
    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Pixabay audio search error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
