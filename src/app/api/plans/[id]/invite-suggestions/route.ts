import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: planId } = await context.params;

    const plan = await db.plan.findUnique({
      where: { id: planId },
      include: {
        creator: { select: { id: true, activeCityId: true } },
        city: { select: { id: true, name: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const cityId = plan.cityId;
    const mood = plan.mood;
    const planCategory = plan.planCategory;
    const blockedIds = await getUserBlockedIds(user.id);

    // Get friends in the same city
    const friends = await db.friendship.findMany({
      where: {
        OR: [{ initiatorId: user.id }, { receiverId: user.id }],
      },
      include: {
        initiator: {
          include: {
            activeCity: { select: { id: true, name: true } },
          },
        },
        receiver: {
          include: {
            activeCity: { select: { id: true, name: true } },
          },
        },
      },
    });

    const friendsInCity = friends
      .map((f) => (f.initiatorId === user.id ? f.receiver : f.initiator))
      .filter((f) => f.activeCityId === cityId && !blockedIds.includes(f.id));

    // Get users with active outside status in the city
    const availableUsers = await db.userOutsideStatus.findMany({
      where: {
        city: plan.city.name,
        expiresAt: { gt: new Date() },
        userId: { notIn: [user.id, ...blockedIds] },
        user: {
          userSettings: { privateDiscoveryMode: false },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            activeCity: { select: { id: true, name: true } },
          },
        },
      },
      take: 20,
    });

    // Get users who like this mood
    const moodLovers = await db.user.findMany({
      where: {
        activeCityId: cityId,
        id: { notIn: [user.id, ...blockedIds] },
        preferredMoods: { has: mood },
        userSettings: { privateDiscoveryMode: false },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        activeCity: { select: { id: true, name: true } },
      },
      take: 20,
    });

    // Get users who have joined similar plans
    const similarPlanParticipants = await db.planParticipant.findMany({
      where: {
        userId: { notIn: [user.id, ...blockedIds] },
        user: { userSettings: { privateDiscoveryMode: false } },
        plan: {
          cityId,
          OR: [{ mood }, { planCategory }],
          status: "COMPLETED",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            activeCity: { select: { id: true, name: true } },
          },
        },
      },
      take: 20,
    });

    // Get active followers in the city
    const followers = await db.follow.findMany({
      where: {
        followerId: user.id,
        following: {
          activeCityId: cityId,
          id: { notIn: blockedIds },
          userSettings: { privateDiscoveryMode: false },
        },
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            activeCity: { select: { id: true, name: true } },
          },
        },
      },
      take: 20,
    });

    // Combine and deduplicate suggestions with reasons
    const suggestions = new Map();

    friendsInCity.forEach((friend) => {
      if (!suggestions.has(friend.id)) {
        suggestions.set(friend.id, {
          user: friend,
          reasons: ["Ami dans ta ville"],
        });
      }
    });

    availableUsers.forEach((status) => {
      const u = status.user;
      if (!suggestions.has(u.id)) {
        suggestions.set(u.id, {
          user: u,
          reasons: ["Disponible ce soir"],
        });
      } else {
        suggestions.get(u.id)?.reasons.push("Disponible ce soir");
      }
    });

    moodLovers.forEach((u) => {
      if (!suggestions.has(u.id)) {
        suggestions.set(u.id, {
          user: u,
          reasons: ["Aime les plans " + mood.toLowerCase()],
        });
      } else {
        suggestions.get(u.id)?.reasons.push("Aime les plans " + mood.toLowerCase());
      }
    });

    similarPlanParticipants.forEach((pp) => {
      const u = pp.user;
      if (!suggestions.has(u.id)) {
        suggestions.set(u.id, {
          user: u,
          reasons: ["A déjà rejoint ce type de plan"],
        });
      } else {
        suggestions.get(u.id)?.reasons.push("A déjà rejoint ce type de plan");
      }
    });

    followers.forEach((f) => {
      const u = f.following;
      if (!suggestions.has(u.id)) {
        suggestions.set(u.id, {
          user: u,
          reasons: ["Abonné actif"],
        });
      } else {
        suggestions.get(u.id)?.reasons.push("Abonné actif");
      }
    });

    const suggestionsArray = Array.from(suggestions.values()).slice(0, 20);

    return NextResponse.json({ suggestions: suggestionsArray });
  } catch (error) {
    console.error("[INVITE_SUGGESTIONS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
