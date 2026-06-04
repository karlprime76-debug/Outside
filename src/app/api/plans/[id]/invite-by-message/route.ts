import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canInviteToPlan, isFriend } from "@/lib/plans/permissions";
import { createNotification } from "@/lib/notifications";
import { logError } from "@/lib/log";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: planId } = await params;

    const allowed = await canInviteToPlan(user.id, planId);
    if (!allowed) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds requis." }, { status: 400 });
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
      planCategory: plan.planCategory,
      mood: plan.mood,
      budgetLevel: plan.budgetLevel,
      maxParticipants: plan.maxParticipants,
      status: plan.status,
      creatorId: plan.creatorId,
    };

    const results: Array<{ userId: string; conversationId: string; messageId: string }> = [];

    for (const targetUserId of userIds) {
      if (targetUserId === user.id) continue;
      const friend = await isFriend(user.id, targetUserId);
      if (!friend) continue;

      // Find or create conversation
      const existing = await db.conversation.findFirst({
        where: {
          participants: {
            every: { userId: { in: [user.id, targetUserId] } },
          },
        },
        include: { participants: true },
      });

      let conversationId: string;
      if (existing && existing.participants.length === 2) {
        conversationId = existing.id;
      } else {
        const conv = await db.conversation.create({
          data: {
            participants: {
              create: [
                { userId: user.id },
                { userId: targetUserId },
              ],
            },
          },
        });
        conversationId = conv.id;
      }

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

      await createNotification({
        type: "PLAN_INVITE",
        title: "Invitation à un plan",
        body: `${user.name || "Quelqu'un"} t'a invité à un plan : "${plan.title}"`,
        recipientId: targetUserId,
        actorId: user.id,
        actorName: user.name || null,
        actorImage: user.image || null,
        data: { conversationId, planId: plan.id },
      });

      results.push({ userId: targetUserId, conversationId, messageId: msg.id });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    logError("[PLAN_ERROR]", "POST /api/plans/[id]/invite-by-message failed", { error: String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
