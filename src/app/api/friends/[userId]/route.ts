import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const friendship = await db.friendship.findFirst({
      where: {
        OR: [
          { initiatorId: user.id, receiverId: userId },
          { initiatorId: userId, receiverId: user.id },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.friendship.delete({ where: { id: friendship.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete friendship error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
