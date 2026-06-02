import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const allowed = await canViewPlan(user.id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plan = await db.plan.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, image: true, isVerified: true } },
        city: true,
        place: true,
        participants: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Get plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.plan.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (existing.creatorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const plan = await db.plan.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        description: body.description ?? undefined,
        status: body.status ?? undefined,
      },
    });

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.plan.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (existing.creatorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.plan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
