import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const tips = await db.outsideTip.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ tips });
  } catch (error) {
    console.error("[ADMIN_TIPS_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, description, mood, city, countryCode, actionLabel, actionUrl, active } = body;

    if (!title || !actionUrl) {
      return NextResponse.json({ error: "Title et actionUrl requis." }, { status: 400 });
    }

    const tip = await db.outsideTip.create({
      data: {
        title,
        description,
        mood,
        city: city || null,
        countryCode: countryCode || null,
        actionLabel,
        actionUrl,
        active: active !== false,
      },
    });

    return NextResponse.json({ tip }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_TIPS_CREATE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis." }, { status: 400 });
    }

    const tip = await db.outsideTip.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tip });
  } catch (error) {
    console.error("[ADMIN_TIPS_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis." }, { status: 400 });
    }

    await db.outsideTip.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_TIPS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
