import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const moment = await db.moment.findUnique({ where: { id } });
    if (!moment) {
      return NextResponse.json({ error: "Moment introuvable." }, { status: 404 });
    }

    const existing = await db.momentLike.findUnique({
      where: { momentId_userId: { momentId: id, userId: user.id } },
    });

    if (existing) {
      return NextResponse.json({ liked: true, likesCount: await db.momentLike.count({ where: { momentId: id } }) });
    }

    await db.momentLike.create({
      data: { momentId: id, userId: user.id },
    });

    const likesCount = await db.momentLike.count({ where: { momentId: id } });
    return NextResponse.json({ liked: true, likesCount });
  } catch (error) {
    console.error("Like moment error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    await db.momentLike.deleteMany({
      where: { momentId: id, userId: user.id },
    });

    const likesCount = await db.momentLike.count({ where: { momentId: id } });
    return NextResponse.json({ liked: false, likesCount });
  } catch (error) {
    console.error("Unlike moment error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
