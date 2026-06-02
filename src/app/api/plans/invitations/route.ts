import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const invitations = await db.planInvitation.findMany({
      where: { receiverId: user.id, status: "PENDING" },
      include: {
        plan: {
          select: {
            id: true,
            title: true,
            mood: true,
            startDate: true,
            city: { select: { name: true } },
            creator: { select: { id: true, name: true, image: true } },
          },
        },
        sender: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("List invitations error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
