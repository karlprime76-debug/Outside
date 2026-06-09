import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; pollId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id, pollId } = await params;

    const poll = await db.planPoll.findUnique({
      where: { id: pollId },
      include: { plan: { select: { creatorId: true } } },
    });

    if (!poll || poll.planId !== id) {
      return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
    }

    if (poll.plan.creatorId !== user.id) {
      return NextResponse.json({ error: "Seul le créateur du plan peut supprimer ce sondage" }, { status: 403 });
    }

    await db.planPoll.delete({ where: { id: pollId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PLAN_POLL_DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; pollId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id, pollId } = await params;
    const body = await req.json();

    const poll = await db.planPoll.findUnique({
      where: { id: pollId },
      include: { plan: { select: { creatorId: true } } },
    });

    if (!poll || poll.planId !== id) {
      return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
    }

    if (poll.plan.creatorId !== user.id) {
      return NextResponse.json({ error: "Seul le créateur du plan peut modifier ce sondage" }, { status: 403 });
    }

    const updated = await db.planPoll.update({
      where: { id: pollId },
      data: {
        isClosed: body.isClosed ?? undefined,
        question: body.question ?? undefined,
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

    return NextResponse.json({ poll: updated });
  } catch (error) {
    console.error("[PLAN_POLL_PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
