import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logPerfEnd, logPerfStart } from "@/lib/log";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";
import { PlanVisibility } from "@prisma/client";

export async function GET() {
  const perfLabel = "[PERF] GET /api/plans/suggestions";
  logPerfStart(perfLabel);

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const blockedIds = await getUserBlockedIds(user.id);

    const userPrefs = await db.user.findUnique({
      where: { id: user.id },
      select: { preferredMoods: true, preferredBudget: true, activeCityId: true },
    });

    if (!userPrefs) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const { preferredMoods, preferredBudget, activeCityId } = userPrefs;

    const friendRows = await db.friendship.findMany({
      where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
      select: { initiatorId: true, receiverId: true },
    });
    const friendIds = friendRows.map((f) =>
      f.initiatorId === user.id ? f.receiverId : f.initiatorId
    );

    let fofIds: string[] = [];
    if (friendIds.length > 0) {
      const fofRows = await db.friendship.findMany({
        where: {
          OR: friendIds.flatMap((fid) => [
            { initiatorId: fid },
            { receiverId: fid },
          ]),
        },
        select: { initiatorId: true, receiverId: true },
      });
      fofIds = Array.from(
        new Set(
          fofRows
            .map((f) => (friendIds.includes(f.initiatorId) ? f.receiverId : f.initiatorId))
            .filter((id) => id !== user.id && !friendIds.includes(id))
        )
      );
    }

    const invitedPlanRows = await db.planInvitation.findMany({
      where: { receiverId: user.id, status: { in: ["PENDING", "ACCEPTED"] } },
      select: { planId: true },
    });
    const invitedPlanIds = invitedPlanRows.map((i) => i.planId);

    const visibilityOr: Record<string, unknown>[] = [
      { visibility: PlanVisibility.PUBLIC },
      { creatorId: user.id },
      { visibility: PlanVisibility.FRIENDS, creatorId: { in: friendIds } },
      { visibility: PlanVisibility.FRIENDS_OF_FRIENDS, creatorId: { in: fofIds } },
      ...(invitedPlanIds.length > 0 ? [{ id: { in: invitedPlanIds } }] : []),
    ];

    const friendParticipations = await db.planParticipant.findMany({
      where: { userId: { in: friendIds }, attendance: "GOING", plan: { status: "ACTIVE" } },
      select: { planId: true },
      take: 50,
    });
    const friendPlanIds = [...new Set(friendParticipations.map((p) => p.planId))];

    const topCreatorRows = await db.user.findMany({
      where: { trustScore: { gte: 50 }, id: { not: user.id, notIn: blockedIds } },
      select: { id: true },
    });
    const topCreatorIds = topCreatorRows.map((c) => c.id);

    const planScores = new Map<string, number>();

    const prefWhere: Record<string, unknown> = {
      status: "ACTIVE",
      creatorId: { not: user.id, notIn: blockedIds },
      OR: visibilityOr,
    };
    if (activeCityId) prefWhere.cityId = activeCityId;
    if (preferredMoods.length > 0) prefWhere.mood = { in: preferredMoods };
    if (preferredBudget) prefWhere.budgetLevel = preferredBudget;

    const prefPlans = await db.plan.findMany({ where: prefWhere, select: { id: true }, take: 30 });
    prefPlans.forEach((p) => planScores.set(p.id, (planScores.get(p.id) || 0) + 3));

    if (friendPlanIds.length > 0) {
      const friendGoingPlans = await db.plan.findMany({
        where: { id: { in: friendPlanIds }, status: "ACTIVE", creatorId: { not: user.id, notIn: blockedIds }, OR: visibilityOr },
        select: { id: true },
        take: 30,
      });
      friendGoingPlans.forEach((p) => planScores.set(p.id, (planScores.get(p.id) || 0) + 2));
    }

    if (topCreatorIds.length > 0) {
      const creatorPlans = await db.plan.findMany({
        where: { creatorId: { in: topCreatorIds.filter((id) => !blockedIds.includes(id)) }, status: "ACTIVE", OR: visibilityOr },
        select: { id: true },
        take: 30,
      });
      creatorPlans.forEach((p) => planScores.set(p.id, (planScores.get(p.id) || 0) + 1));
    }

    const candidateIds = [...planScores.keys()];
    if (candidateIds.length === 0) {
      logPerfEnd(perfLabel);
      return NextResponse.json({ plans: [] });
    }

    const plans = await db.plan.findMany({
      where: { id: { in: candidateIds }, status: "ACTIVE", creatorId: { not: user.id, notIn: blockedIds }, OR: visibilityOr },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        participants: { select: { attendance: true } },
      },
    });

    const scored = plans
      .filter((p) => p.creatorId !== user.id)
      .map((plan) => ({
        plan,
        score: planScores.get(plan.id) || 0,
      }));

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.plan.startDate.getTime() - b.plan.startDate.getTime();
    });

    const top10 = scored.slice(0, 10);

    const plansWithCounts = top10.map(({ plan }) => {
      const going = plan.participants.filter((p) => p.attendance === "GOING").length;
      const maybe = plan.participants.filter((p) => p.attendance === "MAYBE").length;
      return {
        ...plan,
        latitude: undefined,
        longitude: undefined,
        _count: { participants: going + maybe, going, maybe },
      };
    });

    logPerfEnd(perfLabel);
    return NextResponse.json({ plans: plansWithCounts });
  } catch (error) {
    logPerfEnd(perfLabel);
    console.error("[SUGGESTIONS]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
