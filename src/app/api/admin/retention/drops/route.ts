import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const drops = await db.outsideDrop.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ drops, count: drops.length });
  } catch (error) {
    console.error("[ADMIN_DROPS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, type, city, countryCode, startsAt, endsAt, targetUrl } = body;

    if (!title || !type) {
      return NextResponse.json({ error: "title and type are required" }, { status: 400 });
    }

    const drop = await db.outsideDrop.create({
      data: {
        title,
        description,
        type,
        city,
        countryCode,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        targetUrl,
        active: true,
      },
    });

    return NextResponse.json(drop);
  } catch (error) {
    console.error("[ADMIN_CREATE_DROP_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
