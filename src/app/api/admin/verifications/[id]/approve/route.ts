import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recalculateAndUpdateTrustScore } from "@/lib/trust";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;

    const verification = await db.identityVerification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!verification) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    await db.identityVerification.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    await db.user.update({
      where: { id: verification.userId },
      data: {
        isVerified: true,
        identityVerificationStatus: "APPROVED",
      },
    });

    await db.trustSignal.create({
      data: {
        userId: verification.userId,
        type: "IDENTITY_VERIFIED",
        label: "Identité vérifiée",
        value: true,
        source: "ADMIN",
      },
    });

    await recalculateAndUpdateTrustScore(verification.userId);

    return NextResponse.json({ message: "Profil vérifié." });
  } catch (error) {
    console.error("Approve verification error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
