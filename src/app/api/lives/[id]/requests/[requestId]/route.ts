import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createLiveKitToken } from "@/lib/livekit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; requestId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.email) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const { id, requestId } = await params;
    const user = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    const live = await db.liveSession.findUnique({ where: { id }, select: { hostId: true } });
    if (!live) return NextResponse.json({ error: "Live introuvable" }, { status: 404 });
    if (live.hostId !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { action } = await req.json();
    if (!action || !["ACCEPTED", "DECLINED"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const request = await db.liveRequest.findUnique({
      where: { id: requestId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!request || request.liveId !== id) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    if (request.status !== "PENDING") return NextResponse.json({ error: "Déjà traité" }, { status: 400 });

    const updated = await db.liveRequest.update({
      where: { id: requestId },
      data: { status: action },
    });

    let publisherToken: string | null = null;
    if (action === "ACCEPTED") {
      publisherToken = await createLiveKitToken({
        liveId: id,
        userId: request.userId,
        name: request.user.name || "Utilisateur",
        isHost: false,
        canPublish: true,
        canPublishData: true,
      });
    }

    return NextResponse.json({ request: updated, publisherToken });
  } catch (error) {
    console.error("[HANDLE_REQUEST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
