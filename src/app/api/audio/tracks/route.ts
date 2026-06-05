import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

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

    const tracks = await db.audioTrack.findMany({
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

    const nextCursor = tracks.length === limit ? tracks[tracks.length - 1].id : null;

    return NextResponse.json({ tracks, nextCursor });
  } catch (error) {
    console.error("List audio tracks error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
