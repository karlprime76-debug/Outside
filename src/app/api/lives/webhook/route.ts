import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteLiveKitRoom } from "@/lib/livekit";

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.LIVEKIT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook non configuré." }, { status: 501 });
    }

    const body = await req.json();
    const { event, room } = body;

    if (!event || !room?.name) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    // Room name format: outside-live-<liveId>
    const prefix = "outside-live-";
    if (!room.name.startsWith(prefix)) {
      return NextResponse.json({ ok: true });
    }

    const liveId = room.name.slice(prefix.length);

    if (event === "room_finished") {
      await db.liveSession.update({
        where: { id: liveId },
        data: { status: "ENDED", endedAt: new Date() },
      });
      deleteLiveKitRoom(liveId).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[LIVEKIT_WEBHOOK]", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}