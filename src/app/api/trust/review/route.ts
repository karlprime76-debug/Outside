import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { canReviewUser, recalculateAndUpdateTrustScore } from "@/lib/trust";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reviewedId, planId, wasPresent, respectful, realPlan, goodVibe, comment } = body;

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
        realPlan: realPlan ?? null,
        goodVibe: goodVibe ?? null,
        comment: comment ?? null,
      },
    });

    await recalculateAndUpdateTrustScore(reviewedId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trust review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
