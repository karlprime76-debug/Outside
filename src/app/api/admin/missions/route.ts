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
    const missions = await db.cityMission.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ missions });
  } catch (error) {
    console.error("[ADMIN_MISSIONS_ERROR]", error);
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
    const { key, title, description, city, rewardLabel, active } = body;

    if (!key || !title) {
      return NextResponse.json({ error: "Key et title requis." }, { status: 400 });
    }

    const mission = await db.cityMission.create({
      data: {
        key,
        title,
        description,
        city: city || null,
        rewardLabel,
        active: active !== false,
      },
    });

    return NextResponse.json({ mission }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_MISSIONS_CREATE_ERROR]", error);
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

    const mission = await db.cityMission.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ mission });
  } catch (error) {
    console.error("[ADMIN_MISSIONS_UPDATE_ERROR]", error);
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

    await db.cityMission.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_MISSIONS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
