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

  const requests = await db.proAccount.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    take: 200,
  });

  return NextResponse.json({ requests });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, rejectedReason } = body;

  if (!id || !status || !["APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  try {
    const updated = await db.proAccount.update({
      where: { id },
      data: {
        status,
        verifiedAt: status === "APPROVED" ? new Date() : undefined,
        rejectedReason: status === "REJECTED" || status === "SUSPENDED" ? rejectedReason || null : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // When approved, update the user's accountKind to the requested kind
    if (status === "APPROVED" && updated.requestedAccountKind) {
      await db.user.update({
        where: { id: updated.userId },
        data: { accountKind: updated.requestedAccountKind },
      });
    }

    logError("[ADMIN_PRO]", `ProAccount ${id} updated to ${status} by ${session.user.email}`, {
      reason: rejectedReason || null,
    });

    return NextResponse.json({ proAccount: updated, message: "Demande mise à jour." });
  } catch (err) {
    logError("[ADMIN_PRO_ERROR]", "Failed to update pro account", { error: String(err), id });
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}
