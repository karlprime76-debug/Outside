import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const allowed = await canViewPlan(user.id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const expenses = await db.planExpense.findMany({
      where: { planId: id },
      orderBy: { createdAt: "desc" },
      include: {
        paidBy: { select: { id: true, name: true, image: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    const participantIds = new Set<string>();
    const totalByUser = new Map<string, number>();
    const paidByUser = new Map<string, number>();

    for (const exp of expenses) {
      const paid = Number(exp.amount);
      paidByUser.set(exp.paidById, (paidByUser.get(exp.paidById) || 0) + paid);
      participantIds.add(exp.paidById);

      for (const share of exp.shares) {
        participantIds.add(share.userId);
        totalByUser.set(share.userId, (totalByUser.get(share.userId) || 0) + Number(share.amount));
      }
    }

    const balances: { userId: string; name: string | null; image: string | null; owes: number; isOwed: number; net: number }[] = [];

    for (const pid of participantIds) {
      const paid = paidByUser.get(pid) || 0;
      const share = totalByUser.get(pid) || 0;
      const net = paid - share;
      const participant = expenses
        .flatMap((e) => [e.paidBy, ...e.shares.map((s) => s.user)])
        .find((p) => p.id === pid);
      balances.push({
        userId: pid,
        name: participant?.name || null,
        image: participant?.image || null,
        owes: net < 0 ? Math.abs(net) : 0,
        isOwed: net > 0 ? net : 0,
        net,
      });
    }

    return NextResponse.json({ expenses, balances });
  } catch (error) {
    console.error("[EXPENSES_GET]", error);
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
      return NextResponse.json({ error: "Seuls les participants peuvent ajouter des dépenses" }, { status: 403 });
    }

    const body = await req.json();
    const { title, amount, currency, shares } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Titre requis" }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    if (!shares || !Array.isArray(shares) || shares.length === 0) {
      return NextResponse.json({ error: "Au moins un participant requis" }, { status: 400 });
    }

    const shareSum = shares.reduce((sum: number, s: { amount: number }) => sum + parseFloat(String(s.amount)), 0);
    if (Math.abs(shareSum - parsedAmount) > 0.01) {
      return NextResponse.json({ error: "La somme des parts ne correspond pas au montant total" }, { status: 400 });
    }

    const participantUserIds = await db.planParticipant.findMany({
      where: { planId: id },
      select: { userId: true },
    });
    const validIds = new Set(participantUserIds.map((p) => p.userId));

    for (const share of shares) {
      if (!validIds.has(share.userId)) {
        return NextResponse.json({ error: "Participant invalide" }, { status: 400 });
      }
    }

    const expense = await db.planExpense.create({
      data: {
        planId: id,
        paidById: user.id,
        title: title.trim(),
        amount: parsedAmount,
        currency: currency || "XOF",
        shares: {
          create: shares.map((s: { userId: string; amount: number }) => ({
            userId: s.userId,
            amount: parseFloat(String(s.amount)),
          })),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true, image: true } },
        shares: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("[EXPENSES_POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
