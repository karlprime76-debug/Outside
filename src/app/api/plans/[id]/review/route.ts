import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateUserTrust } from "@/lib/trust/calculate-user-trust";
import { calculatePlanConfirmation } from "@/lib/trust/calculate-user-trust";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const { id: planId } = await context.params;
    const body = await req.json();
    const {
      reviewedUserId,
      wasPresent,
      wasRespectful,
      profileSeemedReal,
      planWasReal,
      comment,
    } = body;

    // Input validation
    if (reviewedUserId != null && (typeof reviewedUserId !== "string" || reviewedUserId.length === 0)) {
      return NextResponse.json({ error: "reviewedUserId invalide." }, { status: 400 });
    }
    if (wasPresent != null && typeof wasPresent !== "boolean") {
      return NextResponse.json({ error: "wasPresent doit être un booléen." }, { status: 400 });
    }
    if (wasRespectful != null && typeof wasRespectful !== "boolean") {
      return NextResponse.json({ error: "wasRespectful doit être un booléen." }, { status: 400 });
    }
    if (profileSeemedReal != null && typeof profileSeemedReal !== "boolean") {
      return NextResponse.json({ error: "profileSeemedReal doit être un booléen." }, { status: 400 });
    }
    if (planWasReal != null && typeof planWasReal !== "boolean") {
      return NextResponse.json({ error: "planWasReal doit être un booléen." }, { status: 400 });
    }
    if (comment != null && (typeof comment !== "string" || comment.length > 500)) {
      return NextResponse.json({ error: "Commentaire trop long (max 500)." }, { status: 400 });
    }

    // Check if plan exists
    const plan = await db.plan.findUnique({
      where: { id: planId },
      include: {
        participants: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable." }, { status: 404 });
    }

    // Check if plan is completed (reviews only allowed after plan ends)
    if (plan.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Les reviews ne sont disponibles qu'après la fin du plan." },
        { status: 400 }
      );
    }

    // Check if user participated in the plan
    const participant = plan.participants.find((p) => p.userId === user.id);
    if (!participant) {
      return NextResponse.json(
        { error: "Tu n'as pas participé à ce plan." },
        { status: 403 }
      );
    }

    // Cannot review yourself
    if (typeof reviewedUserId === "string" && reviewedUserId === user.id) {
      return NextResponse.json(
        { error: "Tu ne peux pas te noter toi-même." },
        { status: 400 }
      );
    }

    // If reviewing another participant, check they also participated
    if (typeof reviewedUserId === "string" && reviewedUserId.length > 0) {
      const reviewedParticipant = plan.participants.find((p) => p.userId === reviewedUserId);
      if (!reviewedParticipant) {
        return NextResponse.json(
          { error: "L'utilisateur n'a pas participé à ce plan." },
          { status: 400 }
        );
      }
    }

    // Use transaction to prevent race condition
    const review = await db.$transaction(async (tx) => {
      const existingReview = await tx.planParticipantReview.findUnique({
        where: {
          planId_reviewerId_reviewedUserId: {
            planId,
            reviewerId: user.id,
            reviewedUserId: reviewedUserId || null,
          },
        },
      });

      if (existingReview) {
        return tx.planParticipantReview.update({
          where: { id: existingReview.id },
          data: { wasPresent, wasRespectful, profileSeemedReal, planWasReal, comment },
        });
      }

      return tx.planParticipantReview.create({
        data: {
          planId,
          reviewerId: user.id,
          reviewedUserId,
          wasPresent,
          wasRespectful,
          profileSeemedReal,
          planWasReal,
          comment,
        },
      });
    });

    // Recalculate trust score for reviewed user
    if (reviewedUserId) {
      await calculateUserTrust(reviewedUserId).catch(() => {});
    }

    // Recalculate plan confirmation
    await calculatePlanConfirmation(planId).catch(() => {});

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("[PLAN_REVIEW_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tu dois être connecté." }, { status: 401 });
    }

    const { id: planId } = await context.params;

    // Check if plan exists and user participated
    const plan = await db.plan.findUnique({
      where: { id: planId },
      include: {
        participants: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable." }, { status: 404 });
    }

    const participant = plan.participants.find((p) => p.userId === user.id);
    if (!participant) {
      return NextResponse.json(
        { error: "Tu n'as pas participé à ce plan." },
        { status: 403 }
      );
    }

    // Get reviews for this plan (anonymized)
    const reviews = await db.planParticipantReview.findMany({
      where: { planId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Anonymize reviews - don't show reviewer identity to others
    const anonymizedReviews = reviews.map((review) => ({
      id: review.id,
      wasPresent: review.wasPresent,
      wasRespectful: review.wasRespectful,
      profileSeemedReal: review.profileSeemedReal,
      planWasReal: review.planWasReal,
      comment: review.comment,
      isMyReview: review.reviewerId === user.id,
      createdAt: review.createdAt,
    }));

    return NextResponse.json({ reviews: anonymizedReviews });
  } catch (error) {
    console.error("[PLAN_REVIEW_GET_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
