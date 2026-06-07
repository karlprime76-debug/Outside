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
    const drops = await db.outsideDrop.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ drops });
  } catch (error) {
    console.error("[ADMIN_DROPS_ERROR]", error);
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
    const { title, description, type, city, countryCode, targetUrl, active, startsAt, endsAt } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "Title et type requis." }, { status: 400 });
    }

    const drop = await db.outsideDrop.create({
      data: {
        title,
        description,
        type,
        city: city || null,
        countryCode: countryCode || null,
        targetUrl: targetUrl || null,
        active: active !== false,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    return NextResponse.json({ drop }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_DROPS_CREATE_ERROR]", error);
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

    const drop = await db.outsideDrop.update({
      where: { id },
      data: {
        ...updateData,
        startsAt: updateData.startsAt ? new Date(updateData.startsAt) : undefined,
        endsAt: updateData.endsAt ? new Date(updateData.endsAt) : undefined,
      },
    });

    return NextResponse.json({ drop });
  } catch (error) {
    console.error("[ADMIN_DROPS_UPDATE_ERROR]", error);
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

    await db.outsideDrop.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_DROPS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
