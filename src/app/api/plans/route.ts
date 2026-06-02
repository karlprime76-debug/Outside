import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createPlanSchema } from "@/lib/validation/schemas";
import { PlanVisibility } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId");
    const mood = searchParams.get("mood");
    const budgetLevel = searchParams.get("budgetLevel");
    const category = searchParams.get("category");
    const travelerFriendly = searchParams.get("travelerFriendly");

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

    const invitedPlanIds = await db.planInvitation.findMany({
      where: { receiverId: user.id, status: { in: ["PENDING", "ACCEPTED"] } },
      select: { planId: true },
    });
    const invitedIds = invitedPlanIds.map((i) => i.planId);

    const baseWhere: Record<string, unknown> = { status: "ACTIVE" };
    if (cityId) baseWhere.cityId = cityId;
    if (mood) baseWhere.mood = mood;
    if (budgetLevel) baseWhere.budgetLevel = budgetLevel;
    if (category) baseWhere.category = category;
    if (travelerFriendly === "true") baseWhere.isTravelerFriendly = true;

    const plans = await db.plan.findMany({
      where: {
        ...baseWhere,
        OR: [
          { visibility: PlanVisibility.PUBLIC },
          { creatorId: user.id },
          { visibility: PlanVisibility.FRIENDS, creatorId: { in: friendIds } },
          { visibility: PlanVisibility.FRIENDS_OF_FRIENDS, creatorId: { in: fofIds } },
          ...(invitedIds.length > 0 ? [{ id: { in: invitedIds } }] : []),
        ],
      },
      orderBy: { startDate: "asc" },
      take: 50,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        city: { select: { id: true, name: true } },
        place: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("List plans error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const plan = await db.plan.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        mood: data.mood,
        budgetLevel: data.budgetLevel,
        estimatedCost: data.estimatedCost,
        cityId: data.cityId,
        placeId: data.placeId,
        neighborhood: data.neighborhood,
        latitude: data.latitude,
        longitude: data.longitude,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        maxParticipants: data.maxParticipants,
        visibility: data.visibility,
        isTravelerFriendly: data.isTravelerFriendly,
        safetyLevel: data.safetyLevel,
        rules: data.rules,
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("Create plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
