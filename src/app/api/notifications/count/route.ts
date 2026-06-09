import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const count = await getUnreadCount(session.user.id);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[NOTIF_COUNT]", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
