import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const polls = await db.planPoll.findMany({
      where: { planId: id },
      orderBy: { createdAt: "desc" },
      include: {
        options: {
          orderBy: { createdAt: "asc" },
          include: {
            _count: { select: { votes: true } },
            votes: { where: { userId: user.id }, select: { id: true } },
          },
        },
      },
    });

    return NextResponse.json({ polls });
  } catch (error) {
    console.error("[PLAN_POLLS_GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const participant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Seuls les participants peuvent créer un sondage" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.question || !body.options || !Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json({ error: "Question et au moins 2 options requises" }, { status: 400 });
    }

    const poll = await db.planPoll.create({
      data: {
        planId: id,
        question: body.question,
        multiple: body.multiple ?? false,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        options: {
          create: body.options.map((label: string) => ({ label })),
        },
      },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } },
            votes: { where: { userId: user.id }, select: { id: true } },
          },
        },
      },
    });

    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    console.error("[PLAN_POLLS_POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
