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

    const plan = await db.plan.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        city: true,
        place: true,
        participants: {
          where: { attendance: { not: "LEFT" } },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { author: { select: { id: true, name: true, image: true } } },
        },
        polls: {
          include: {
            options: {
              include: {
                votes: { select: { id: true, userId: true } },
              },
            },
          },
        },
        expenses: {
          select: { amount: true, currency: true },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, image: true } },
            reviewedUser: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    if (plan.status !== "COMPLETED") {
      return NextResponse.json({ error: "Les souvenirs sont disponibles uniquement pour les plans terminés" }, { status: 400 });
    }

    const isParticipant = plan.participants.some((p) => p.user.id === user.id) || plan.creatorId === user.id;
    if (!isParticipant) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const checkedInParticipants = plan.participants.filter((p) => p.checkedInAt);
    const messageCount = await db.planMessage.count({ where: { planId: id, isDeleted: false } });
    const totalSpent = plan.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const currency = plan.expenses[0]?.currency || "XOF";

    const highlight = plan.reviews
      .filter((r) => r.reviewedUserId)
      .reduce<{ userId: string; name: string | null; image: string | null; score: number; count: number }[]>((acc, r) => {
        const id = r.reviewedUserId!;
        const existing = acc.find((a) => a.userId === id);
        if (existing) {
          existing.count++;
          if (r.wasPresent || r.wasRespectful || r.profileSeemedReal) existing.score++;
        } else {
          acc.push({
            userId: id,
            name: r.reviewedUser?.name || null,
            image: r.reviewedUser?.image || null,
            score: (r.wasPresent ? 1 : 0) + (r.wasRespectful ? 1 : 0) + (r.profileSeemedReal ? 1 : 0),
            count: 1,
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.score / b.count - a.score / a.count)[0] || null;

    return NextResponse.json({
      plan: {
        id: plan.id,
        title: plan.title,
        startDate: plan.startDate,
        status: plan.status,
        city: { name: plan.city.name },
        place: plan.place ? { name: plan.place.name } : null,
        creator: plan.creator,
      },
      participants: plan.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        image: p.user.image,
        attendance: p.attendance,
        checkedInAt: p.checkedInAt,
      })),
      checkedInCount: checkedInParticipants.length,
      participantCount: plan.participants.length,
      messageCount,
      recentMessages: plan.messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt,
        author: m.author,
      })),
      polls: plan.polls.map((poll) => ({
        id: poll.id,
        question: poll.question,
        isClosed: poll.isClosed,
        options: poll.options.map((o) => ({
          id: o.id,
          label: o.label,
          voteCount: o.votes.length,
        })),
        totalVotes: poll.options.reduce((sum, o) => sum + o.votes.length, 0),
      })),
      expenses: {
        total: totalSpent,
        currency,
        count: plan.expenses.length,
      },
      highlight,
    });
  } catch (error) {
    console.error("[MEMORIES]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
