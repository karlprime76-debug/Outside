import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: circleId } = await context.params;

    const circle = await db.outingCircle.findUnique({ where: { id: circleId } });
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }
    if (circle.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await db.outingCircleMember.findMany({
      where: { circleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            activeCity: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("[CIRCLE_MEMBERS_GET]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: circleId } = await context.params;
    const { userId: targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const circle = await db.outingCircle.findUnique({ where: { id: circleId } });
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }
    if (circle.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await db.outingCircleMember.findUnique({
      where: { circleId_userId: { circleId, userId: targetUserId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }

    const member = await db.outingCircleMember.create({
      data: { circleId, userId: targetUserId },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("[CIRCLE_MEMBERS_POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: circleId } = await context.params;
    const { userId: targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const circle = await db.outingCircle.findUnique({ where: { id: circleId } });
    if (!circle) {
      return NextResponse.json({ error: "Circle not found" }, { status: 404 });
    }
    if (circle.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.outingCircleMember.delete({
      where: { circleId_userId: { circleId, userId: targetUserId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CIRCLE_MEMBERS_DELETE]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
