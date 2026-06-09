import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const trustProfile = await db.userTrustProfile.findUnique({
      where: { userId: id },
      select: {
        level: true,
        outsideScore: true,
        presenceScore: true,
        respectScore: true,
        realProfileScore: true,
        organizerScore: true,
        plansJoined: true,
        plansCreated: true,
        positiveReviews: true,
      },
    });

    return NextResponse.json({ trustProfile: trustProfile || null });
  } catch (error) {
    console.error("[RELIABILITY_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
