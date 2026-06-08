import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Get the plan
    const plan = await db.plan.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        cityId: true,
        creatorId: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    // Get or create referral code for user
    let referralCode = await db.referralInvite.findFirst({
      where: { inviterId: user.id },
      select: { code: true },
    });

    if (!referralCode) {
      const code = generateReferralCode(user.id);
      referralCode = await db.referralInvite.create({
        data: {
          inviterId: user.id,
          code,
        },
        select: { code: true },
      });
    }

    // Generate shareable link
    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/plans/${id}?ref=${referralCode.code}`;

    return NextResponse.json({
      shareUrl,
      planId: plan.id,
      planTitle: plan.title,
      referralCode: referralCode.code,
    });
  } catch (error) {
    console.error("Share link error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function generateReferralCode(userId: string): string {
  const hash = userId.split("-")[0];
  const random = Math.random().toString(36).substring(2, 6);
  return `${hash}${random}`.toUpperCase();
}
