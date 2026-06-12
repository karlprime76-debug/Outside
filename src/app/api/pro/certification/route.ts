import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const proAccount = await db.proAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!proAccount) {
      return NextResponse.json({ error: "Compte PRO introuvable." }, { status: 404 });
    }

    if (proAccount.status !== "APPROVED") {
      return NextResponse.json({ error: "Votre compte PRO doit être approuvé d'abord." }, { status: 400 });
    }

    if (proAccount.certificationStatus === "PENDING") {
      return NextResponse.json({ error: "Demande déjà en cours." }, { status: 400 });
    }

    if (proAccount.certificationStatus === "APPROVED") {
      return NextResponse.json({ error: "Déjà certifié." }, { status: 400 });
    }

    await db.proAccount.update({
      where: { userId: session.user.id },
      data: {
        certificationStatus: "PENDING",
        certificationRequestedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: "Demande de certification envoyée." });
  } catch (error) {
    logError("[PRO_CERTIFICATION_ERROR]", "POST /api/pro/certification failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const proAccount = await db.proAccount.findUnique({
      where: { userId: session.user.id },
      select: {
        certificationStatus: true,
        certificationRequestedAt: true,
        certificationReviewedAt: true,
        status: true,
      },
    });

    return NextResponse.json({ proAccount });
  } catch (error) {
    logError("[PRO_CERTIFICATION_ERROR]", "GET /api/pro/certification failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
