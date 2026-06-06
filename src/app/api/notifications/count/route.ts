import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const count = await getUnreadCount(session.user.id);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[GET /api/notifications/count] Error:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
