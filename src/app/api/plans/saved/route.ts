import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const saved = await db.savedPlan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        plan: {
          include: {
            city: { select: { name: true } },
            creator: { select: { id: true, name: true, image: true } },
            _count: { select: { participants: true } },
          },
        },
      },
    });

    return NextResponse.json({ plans: saved.map((s) => s.plan) });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
