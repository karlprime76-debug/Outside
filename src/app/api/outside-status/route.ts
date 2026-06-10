import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await db.userOutsideStatus.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            activeCity: { select: { name: true } },
          },
        },
      },
    });

    // Check if status is expired
    if (status && status.expiresAt < new Date()) {
      await db.userOutsideStatus.delete({
        where: { userId: user.id },
      });
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({ status });
  } catch (error) {
    console.error("[OUTSIDE_STATUS_GET_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, text, durationHours = 2 } = body;

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + durationHours);

    // Get user's active city
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { activeCity: true },
    });

    const city = (userData?.activeCity?.name ?? user.activeCity?.name) ?? null;
    const countryCode = (userData?.activeCity?.countryCode ?? user.activeCity?.countryCode) ?? null;

    // Upsert the status
    const status = await db.userOutsideStatus.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        type,
        text,
        city,
        countryCode,
        expiresAt,
      },
      update: {
        type,
        text,
        city,
        countryCode,
        expiresAt,
      },
    });

    return NextResponse.json({ status });
  } catch (error) {
    console.error("[OUTSIDE_STATUS_POST_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.userOutsideStatus.findUnique({
      where: { userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: true });
    }

    await db.userOutsideStatus.delete({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OUTSIDE_STATUS_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
