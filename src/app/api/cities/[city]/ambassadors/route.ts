import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBlockedIds } from "@/lib/blocks";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  try {
    const { city } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const blockedIds = await getUserBlockedIds(user.id);

    // Get ambassadors for this city
    const ambassadors = await db.user.findMany({
      where: {
        isAmbassador: true,
        ambassadorCity: city,
        id: { notIn: blockedIds },
        userSettings: { privateDiscoveryMode: false },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        isVerified: true,
        ambassadorCity: true,
      },
      take: 10,
    });

    return NextResponse.json({
      city,
      ambassadors,
    });
  } catch (error) {
    console.error("[AMBASSADORS_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
