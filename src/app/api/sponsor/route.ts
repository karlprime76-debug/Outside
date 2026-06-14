import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const body = await req.json();
    const { momentId, planId, budget, currency, targetCity } = body;

    if (!momentId && !planId) {
      return NextResponse.json({ error: "momentId ou planId requis" }, { status: 400 });
    }
    if (!budget || budget <= 0) {
      return NextResponse.json({ error: "Budget invalide" }, { status: 400 });
    }

    const sponsorship = await db.sponsorship.create({
      data: {
        userId: session.user.id,
        momentId: momentId || null,
        planId: planId || null,
        budget,
        currency: currency || "XOF",
        status: "PENDING",
        targetCity: targetCity || null,
      },
    });

    if (momentId) {
      await db.moment.update({ where: { id: momentId }, data: { isSponsored: true } });
    }

    return NextResponse.json({ sponsorship }, { status: 201 });
  } catch (error) {
    console.error("[SPONSOR_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const sponsorships = await db.sponsorship.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        moment: { select: { id: true, mediaUrl: true, caption: true, type: true } },
        plan: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ sponsorships });
  } catch (error) {
    console.error("[SPONSOR_LIST_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
