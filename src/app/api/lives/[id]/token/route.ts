import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createLiveKitToken, createLiveKitRoomName, getLiveKitEnv } from "@/lib/livekit";
import { notifyLiveStarted } from "@/lib/live-notifications";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
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
      include: {
        host: { select: { id: true, name: true } },
      },
    });

    if (!live) {
      return NextResponse.json(
        { message: "Live introuvable.", code: "LIVE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { mode } = body;

    const isHost = live.hostId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";

    if (mode === "host" && !isHost && !isAdmin) {
      return NextResponse.json(
        { message: "Tu n'es pas autorisé à lancer ce live.", code: "NOT_HOST" },
        { status: 403 }
      );
    }

    if (mode !== "host" && mode !== "viewer") {
      return NextResponse.json(
        { message: "Mode invalide.", code: "INVALID_MODE" },
        { status: 400 }
      );
    }

    if (mode === "viewer" && live.status === "SCHEDULED") {
      return NextResponse.json(
        { message: "Ce live n'a pas encore commencé.", code: "NOT_STARTED" },
        { status: 400 }
      );
    }

    if (live.status === "ENDED" || live.status === "BLOCKED") {
      return NextResponse.json(
        { message: "Ce live est terminé.", code: "LIVE_ENDED" },
        { status: 400 }
      );
    }

    let env;
    try {
      env = getLiveKitEnv();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Configuration LiveKit manquante.";
      return NextResponse.json(
        { message: msg, code: "LIVEKIT_CONFIG_ERROR" },
        { status: 500 }
      );
    }

    const roomName = live.livekitRoomName || createLiveKitRoomName(live.id);

    // Mettre à jour le live avec le roomName si pas encore défini
    if (!live.livekitRoomName) {
      await db.liveSession.update({
        where: { id: live.id },
        data: { livekitRoomName: roomName },
      });
    }

    // Si le host demande un token, passer le live en LIVE
    if (mode === "host" && live.status === "SCHEDULED") {
      await db.liveSession.update({
        where: { id: live.id },
        data: { status: "LIVE", startedAt: new Date() },
      });

      // Notifier abonnés, amis et utilisateurs concernés
      notifyLiveStarted(live.id).catch(() => {});
    }

    const token = await createLiveKitToken({
      liveId: live.id,
      userId: user.id,
      name: user.name || `Utilisateur ${user.id.slice(0, 6)}`,
      isHost: mode === "host",
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[LIVEKIT_API_TOKEN]", { liveId: live.id, mode, isHost: mode === "host", roomName });
    }

    return NextResponse.json({
      token,
      url: env.url,
      roomName,
      mode,
      isHost: mode === "host",
      message: "Token LiveKit généré.",
      code: "SUCCESS",
    });
  } catch (error) {
    console.error("[LIVEKIT_TOKEN] Error:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue.", code: "UNEXPECTED_ERROR" },
      { status: 500 }
    );
  }
}
