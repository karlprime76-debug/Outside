import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const reports = await db.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        reporter: { select: { id: true, name: true, username: true, image: true } },
        reportedUser: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("[ADMIN_REPORTS_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    const updated = await db.report.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error("[ADMIN_REPORTS_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
