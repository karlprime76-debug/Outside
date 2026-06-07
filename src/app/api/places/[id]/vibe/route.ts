import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: placeId } = await context.params;

    // Get recent vibe signals for this place (last 24 hours)
    const signals = await db.placeVibeSignal.findMany({
      where: {
        placeId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Count signals by type
    const signalCounts = signals.reduce((acc, signal) => {
      acc[signal.type] = (acc[signal.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      signals,
      signalCounts,
    });
  } catch (error) {
    console.error("[PLACE_VIBE_GET_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: placeId } = await context.params;
    const body = await req.json();
    const { type, note } = body;

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    // Get user's active city
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { activeCity: true },
    });

    const city = (userData?.activeCity?.name ?? user.activeCity?.name) ?? null;
    const countryCode = (userData?.activeCity?.countryCode ?? user.activeCity?.countryCode) ?? null;

    const signal = await db.placeVibeSignal.create({
      data: {
        placeId,
        userId: user.id,
        city,
        countryCode,
        type,
        note,
      },
    });

    return NextResponse.json({ signal }, { status: 201 });
  } catch (error) {
    console.error("[PLACE_VIBE_POST_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
