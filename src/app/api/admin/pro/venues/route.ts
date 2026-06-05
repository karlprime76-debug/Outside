import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/log";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const where = statusFilter && ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].includes(statusFilter)
    ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" }
    : {};

  const venues = await db.proVenue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
    },
    take: 200,
  });

  return NextResponse.json({ venues });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, rejectionReason } = body;

  if (!id || !status || !["APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  try {
    const updated = await db.proVenue.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" || status === "SUSPENDED" ? rejectionReason || null : null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    logError("[ADMIN_PRO]", `ProVenue ${id} updated to ${status} by ${session.user.email}`, {
      reason: rejectionReason || null,
    });

    return NextResponse.json({ venue: updated, message: "Demande mise à jour." });
  } catch (err) {
    logError("[ADMIN_PRO_ERROR]", "Failed to update pro venue", { error: String(err), id });
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}
