import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  const body = await req.json();
  const { id, certificationStatus } = body;

  if (!id || !certificationStatus || !["APPROVED", "REJECTED"].includes(certificationStatus)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  try {
    const updated = await db.proAccount.update({
      where: { id },
      data: {
        certificationStatus,
        certificationReviewedAt: new Date(),
      },
      include: {
        user: { select: { id: true } },
      },
    });

    if (certificationStatus === "APPROVED") {
      await db.user.update({
        where: { id: updated.userId },
        data: { isVerified: true },
      });
    }

    logError("[ADMIN_PRO]", `ProAccount ${id} certification ${certificationStatus} by ${session.user.email}`);

    return NextResponse.json({ proAccount: updated });
  } catch (err) {
    logError("[ADMIN_PRO_ERROR]", "Failed to update certification", { error: String(err), id });
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}
