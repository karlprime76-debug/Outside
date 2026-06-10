import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureUserReferralCode, getAppBaseUrl } from "@/lib/referral";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const plan = await db.plan.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 });
    }

    const { code } = await ensureUserReferralCode(user.id);
    const shareUrl = `${getAppBaseUrl()}/plans/${id}?ref=${code}`;

    return NextResponse.json({
      shareUrl,
      planId: plan.id,
      planTitle: plan.title,
      referralCode: code,
    });
  } catch (error) {
    console.error("Share link error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
