import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Tu dois être connecté.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const live = await db.liveSession.findUnique({
      where: { id },
      select: { hostId: true, status: true },
    });

    if (!live) {
      return NextResponse.json(
        { message: "Live introuvable.", code: "LIVE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const isHost = live.hostId === user.id;
    const isAdmin = user.role === "ADMIN" || user.role === "MODERATOR";

    if (!isHost && !isAdmin) {
      return NextResponse.json(
        { message: "Tu n'es pas autorisé à terminer ce live.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (live.status === "ENDED" || live.status === "BLOCKED") {
      return NextResponse.json(
        { message: "Ce live est déjà terminé.", code: "ALREADY_ENDED" },
        { status: 400 }
      );
    }

    const updated = await db.liveSession.update({
      where: { id },
      data: { status: "ENDED", endedAt: new Date() },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({
      live: updated,
      message: "Live terminé.",
      code: "SUCCESS",
    });
  } catch (error) {
    console.error("[LIVE_END] Error:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue.", code: "UNEXPECTED_ERROR" },
      { status: 500 }
    );
  }
}
