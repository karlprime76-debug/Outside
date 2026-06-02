import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const invitation = await db.planInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.receiverId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation already processed" }, { status: 409 });
    }

    await db.planInvitation.update({
      where: { id },
      data: { status: "DECLINED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Decline invitation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
