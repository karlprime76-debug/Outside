import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        bio: body.bio || null,
        neighborhood: body.neighborhood || null,
        preferredBudget: body.preferredBudget || null,
        language: body.language || "fr",
        preferredMoods: body.preferredMoods?.length ? body.preferredMoods : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        neighborhood: true,
        preferredBudget: true,
        preferredMoods: true,
        language: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Patch me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
