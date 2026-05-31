import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { createPlanSchema } from "@/lib/validation/schemas";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId");
    const mood = searchParams.get("mood");
    const budgetLevel = searchParams.get("budgetLevel");
    const category = searchParams.get("category");
    const travelerFriendly = searchParams.get("travelerFriendly");

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (cityId) where.cityId = cityId;
    if (mood) where.mood = mood;
    if (budgetLevel) where.budgetLevel = budgetLevel;
    if (category) where.category = category;
    if (travelerFriendly === "true") where.isTravelerFriendly = true;

    const plans = await db.plan.findMany({
      where,
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
