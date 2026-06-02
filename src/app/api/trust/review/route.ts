import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canReviewUser, recalculateAndUpdateTrustScore } from "@/lib/trust";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { reviewedId, planId, wasPresent, respectful, realProfile, realPlan, goodVibe, comment } = body;

    if (!reviewedId || typeof reviewedId !== "string") {
      return NextResponse.json({ error: " reviewedId requis." }, { status: 400 });
    }

    const check = await canReviewUser(user.id, reviewedId, planId);
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 409 });
    }

    await db.trustReview.create({
      data: {
        reviewerId: user.id,
        reviewedId,
        planId: planId ?? null,
        wasPresent: wasPresent ?? null,
        respectful: respectful ?? null,
        realProfile: realProfile ?? null,
        realPlan: realPlan ?? null,
        goodVibe: goodVibe ?? null,
        comment: comment ?? null,
      },
    });

    // Create trust signals from review
    const signalData: Array<{ type: string; label: string }> = [];
    if (wasPresent === true) signalData.push({ type: "PLAN_ATTENDANCE", label: "Présence confirmée" });
    if (respectful === true) signalData.push({ type: "RESPECTFUL", label: "Respectueux.se" });
    if (realProfile === true) signalData.push({ type: "REAL_PROFILE", label: "Profil réel" });
    if (realPlan === true) signalData.push({ type: "REAL_PLAN", label: "Plan réel" });

    for (const s of signalData) {
      await db.trustSignal.create({
        data: {
          userId: reviewedId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: s.type as any,
          label: s.label,
          value: true,
          validatedByUserId: user.id,
          source: "TRUST_REVIEW",
        },
      });
    }

    await recalculateAndUpdateTrustScore(reviewedId);

    return NextResponse.json({ message: "Merci, ton retour aide à rendre OUTSIDE plus sûr." });
  } catch (error) {
    console.error("Trust review error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
