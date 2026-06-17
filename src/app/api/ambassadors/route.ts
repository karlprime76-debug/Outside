import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can list ambassadors
    if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ambassadors = await db.user.findMany({
      where: {
        isAmbassador: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        email: true,
        bio: true,
        ambassadorCity: true,
        isVerified: true,
        accountKind: true,
        trustScore: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ambassadors });
  } catch (error) {
    console.error("[AMBASSADORS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
