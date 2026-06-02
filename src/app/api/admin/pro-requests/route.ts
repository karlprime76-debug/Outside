import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  const requests = await db.proAccount.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
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

  const updated = await db.proAccount.update({
    where: { id },
    data: {
      status,
      verifiedAt: status === "APPROVED" ? new Date() : null,
      rejectedReason: status === "REJECTED" ? rejectedReason || null : null,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ proAccount: updated, message: "Demise à jour." });
}
