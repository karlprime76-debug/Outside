import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const messages = await db.planMessage.findMany({
      where: { planId: id },
      orderBy: { createdAt: "asc" },
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

    const limit = rateLimit(`message:${user.id}:${id}`, 20, 60000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many messages. Please slow down." },
        { status: 429, headers: getRateLimitHeaders(limit) }
      );
    }

    const participant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Must join plan to chat" }, { status: 403 });
    }

    const body = await req.json();
    const content = body.content?.trim();

    if (!content || content.length > 2000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
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
