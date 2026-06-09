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
    if (reviewedUserId === user.id) {
      return NextResponse.json(
        { error: "Tu ne peux pas te noter toi-même." },
        { status: 400 }
      );
    }

    // If reviewing another participant, check they also participated
    if (reviewedUserId) {
      const reviewedParticipant = plan.participants.find((p) => p.userId === reviewedUserId);
      if (!reviewedParticipant) {
        return NextResponse.json(
          { error: "L'utilisateur n'a pas participé à ce plan." },
          { status: 400 }
        );
      }
    }

    // Check if review already exists
    const existingReview = await db.planParticipantReview.findUnique({
      where: {
        planId_reviewerId_reviewedUserId: {
          planId,
          reviewerId: user.id,
          reviewedUserId: reviewedUserId || null,
        },
      },
    });

    if (existingReview) {
      // Update existing review
      const updatedReview = await db.planParticipantReview.update({
        where: { id: existingReview.id },
        data: {
          wasPresent,
          wasRespectful,
          profileSeemedReal,
          planWasReal,
          comment,
        },
      });
      return NextResponse.json({ review: updatedReview });
    }

    // Create new review
    const review = await db.planParticipantReview.create({
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
