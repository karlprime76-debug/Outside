import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = (body.reason as string)?.trim();

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
        status: "REJECTED",
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: reason || null,
      },
    });

    await db.user.update({
      where: { id: verification.userId },
      data: {
        isVerified: false,
        identityVerificationStatus: "REJECTED",
      },
    });

    return NextResponse.json({ message: "Demande rejetée." });
  } catch (error) {
    console.error("Reject verification error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
