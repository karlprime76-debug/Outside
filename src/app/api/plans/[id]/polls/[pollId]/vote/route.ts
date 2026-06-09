import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; pollId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id, pollId } = await params;

    const participant = await db.planParticipant.findUnique({
      where: { planId_userId: { planId: id, userId: user.id } },
    });

    if (!participant) {
      return NextResponse.json({ error: "Seuls les participants peuvent voter" }, { status: 403 });
    }

    const poll = await db.planPoll.findUnique({
      where: { id: pollId },
      include: { options: true },
    });

    if (!poll || poll.planId !== id) {
      return NextResponse.json({ error: "Sondage introuvable" }, { status: 404 });
    }

    if (poll.isClosed) {
      return NextResponse.json({ error: "Ce sondage est fermé" }, { status: 400 });
    }

    if (poll.endsAt && new Date() > poll.endsAt) {
      return NextResponse.json({ error: "Ce sondage est terminé" }, { status: 400 });
    }

    const body = await req.json();
    const optionId = body.optionId;

    if (!optionId) {
      return NextResponse.json({ error: "Option requise" }, { status: 400 });
    }

    const option = poll.options.find((o) => o.id === optionId);
    if (!option) {
      return NextResponse.json({ error: "Option invalide" }, { status: 400 });
    }

    if (!poll.multiple) {
      const existing = await db.planPollVote.findFirst({
        where: { option: { pollId }, userId: user.id },
      });

      if (existing) {
        if (existing.optionId === optionId) {
          await db.planPollVote.delete({ where: { id: existing.id } });
          return NextResponse.json({ vote: null, action: "removed" });
        }

        await db.planPollVote.delete({ where: { id: existing.id } });
      }
    } else {
      const existing = await db.planPollVote.findUnique({
        where: { optionId_userId: { optionId, userId: user.id } },
      });

      if (existing) {
        await db.planPollVote.delete({ where: { id: existing.id } });
        return NextResponse.json({ vote: null, action: "removed" });
      }
    }

    const vote = await db.planPollVote.create({
      data: { optionId, userId: user.id },
    });

    return NextResponse.json({ vote, action: "added" }, { status: 201 });
  } catch (error) {
    console.error("[PLAN_POLL_VOTE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
