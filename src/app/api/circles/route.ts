import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const circles = await db.outingCircle.findMany({
      where: { ownerId: user.id },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ circles });
  } catch (error) {
    console.error("[CIRCLES_GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const circle = await db.outingCircle.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: user.id,
      },
      include: { _count: { select: { members: true } } },
    });

    return NextResponse.json({ circle }, { status: 201 });
  } catch (error) {
    console.error("[CIRCLES_POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
