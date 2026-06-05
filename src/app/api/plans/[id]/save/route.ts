import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const saved = await db.savedPlan.upsert({
      where: {
        userId_planId: {
          userId: session.user.id,
          planId: id,
        },
      },
      create: {
        userId: session.user.id,
        planId: id,
      },
      update: {},
    });

    return NextResponse.json({ saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Impossible de sauvegarder." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.savedPlan.deleteMany({
      where: {
        userId: session.user.id,
        planId: id,
      },
    });

    return NextResponse.json({ message: "Sauvegarde supprimée." });
  } catch {
    return NextResponse.json({ error: "Impossible de supprimer." }, { status: 500 });
  }
}
