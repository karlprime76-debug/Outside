import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canViewPlan } from "@/lib/plans/permissions";
import { createNotification } from "@/lib/notifications";
import { logError } from "@/lib/log";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, planId } = body;

    if (!conversationId || !planId) {
      return NextResponse.json({ error: "Conversation et plan requis." }, { status: 400 });
    }

    // Verify conversation access
    const part = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: user.id },
    });
    if (!part) {
      return NextResponse.json({ error: "Accès refusé à la conversation." }, { status: 403 });
    }

    // Verify plan access
    const allowed = await canViewPlan(user.id, planId);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé au plan." }, { status: 403 });
    }

    const plan = await db.plan.findUnique({
      where: { id: planId },
      include: { city: true },
    });
    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable." }, { status: 404 });
    }

    const metadata = {
      planId: plan.id,
      title: plan.title,
      city: plan.city?.name || null,
      startDate: plan.startDate.toISOString(),
      endDate: plan.endDate?.toISOString() || null,
      category: plan.category,
      mood: plan.mood,
      budgetLevel: plan.budgetLevel,
      maxParticipants: plan.maxParticipants,
      status: plan.status,
      creatorId: plan.creatorId,
    };

    const msg = await db.directMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        content: null,
        type: "PLAN_INVITE",
        metadata: JSON.stringify(metadata),
      },
    });

    await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    // Notify the other participant
    const otherPart = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: { not: user.id } },
    });
    if (otherPart) {
      await createNotification({
        type: "PLAN_INVITE",
        title: "Invitation à un plan",
        body: `${user.name || "Quelqu'un"} t'a invité à un plan : "${plan.title}"`,
        recipientId: otherPart.userId,
        actorId: user.id,
        actorName: user.name || null,
        actorImage: user.image || null,
        data: { conversationId, planId: plan.id },
      });
    }

    return NextResponse.json({
      message: {
        id: msg.id,
        senderId: msg.senderId,
        content: msg.content,
        isDeleted: msg.isDeleted,
        createdAt: msg.createdAt.toISOString(),
        status: msg.status,
        type: msg.type,
        metadata: msg.metadata,
      },
    });
  } catch (error) {
    logError("[PLAN_ERROR]", "POST /api/dm/share-plan failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
