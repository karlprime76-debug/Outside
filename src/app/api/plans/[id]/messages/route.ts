import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

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

    const messages = await db.planMessage.findMany({
      where: { planId: id, isDeleted: false },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const plan = await db.plan.findUnique({
      where: { id },
      select: { creatorId: true, status: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (plan.status === "COMPLETED" || plan.status === "CANCELLED") {
      return NextResponse.json({ error: "Plan is archived. Chat is read-only." }, { status: 403 });
    }

    const isParticipant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
    });

    if (!isParticipant && plan.creatorId !== user.id) {
      return NextResponse.json({ error: "Must join plan to chat" }, { status: 403 });
    }

    const limit = rateLimit(`message:${user.id}:${id}`, 20, 60000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }

    const body = await req.json();
    const content = body.content?.trim();

    if (!content || content.length === 0 || content.length > 500) {
      return NextResponse.json({ error: "Message must be between 1 and 500 characters" }, { status: 400 });
    }

    const message = await db.planMessage.create({
      data: {
        planId: id,
        authorId: user.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Create message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
