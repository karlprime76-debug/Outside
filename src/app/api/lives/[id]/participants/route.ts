import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLiveKitParticipantCount, createLiveKitRoomName } from "@/lib/livekit";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Tu dois être connecté.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const live = await db.liveSession.findUnique({
      where: { id },
      select: { livekitRoomName: true },
    });

    if (!live) {
      return NextResponse.json(
        { message: "Live introuvable.", code: "LIVE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const roomName = live.livekitRoomName || createLiveKitRoomName(id);

    let count = 0;
    try {
      count = await getLiveKitParticipantCount(roomName);
    } catch {
      // Si la room n'existe pas encore, retourner 0
      count = 0;
    }

    return NextResponse.json({ count, roomName });
  } catch (error) {
    console.error("[LIVE_PARTICIPANTS] Error:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue.", code: "UNEXPECTED_ERROR" },
      { status: 500 }
    );
  }
}
