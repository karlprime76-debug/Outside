import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id, expenseId } = await params;

    const expense = await db.planExpense.findUnique({
      where: { id: expenseId },
      include: { plan: { select: { creatorId: true } } },
    });

    if (!expense || expense.planId !== id) {
      return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });
    }

    if (expense.paidById !== user.id && expense.plan.creatorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await db.planExpense.delete({ where: { id: expenseId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EXPENSE_DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id, expenseId } = await params;

    const expense = await db.planExpense.findUnique({
      where: { id: expenseId },
      include: { plan: { select: { creatorId: true } } },
    });

    if (!expense || expense.planId !== id) {
      return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const { shareId } = body;

    if (!shareId || typeof shareId !== "string") {
      return NextResponse.json({ error: "shareId requis" }, { status: 400 });
    }

    const share = await db.planExpenseShare.findUnique({
      where: { id: shareId },
    });

    if (!share || share.expenseId !== expenseId) {
      return NextResponse.json({ error: "Part introuvable" }, { status: 404 });
    }

    if (share.userId !== user.id && expense.paidById !== user.id && expense.plan.creatorId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const updated = await db.planExpenseShare.update({
      where: { id: shareId },
      data: { settled: !share.settled },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ share: updated });
  } catch (error) {
    console.error("[EXPENSE_PATCH]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
