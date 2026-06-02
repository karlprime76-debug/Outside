import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  const request = await db.friendRequest.findUnique({ where: { id } });
  if (!request || request.senderId !== userId) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }

  await db.friendRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ message: "Demande annulée." });
}
