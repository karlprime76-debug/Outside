import { db } from "@/lib/db";

export interface TrustScores {
  outsideScore: number;
  presenceScore: number;
  respectScore: number;
  realProfileScore: number;
  organizerScore: number;
  level: string;
}

export async function calculateUserTrust(userId: string): Promise<TrustScores> {
  // Get or create trust profile
  let trustProfile = await db.userTrustProfile.findUnique({
    where: { userId },
  });

  if (!trustProfile) {
    trustProfile = await db.userTrustProfile.create({
      data: { userId },
    });
  }

  // Get user data for calculation
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      phoneVerified: true,
      isVerified: true,
      identityVerificationStatus: true,
      image: true,
      bio: true,
      username: true,
      name: true,
    },
  });

  if (!user) {
    return trustProfile as TrustScores;
  }

  // Get plan participation data
  const [plansJoined, plansCreated, reportsReceived] =
    await Promise.all([
      db.planParticipant.count({ where: { userId } }),
      db.plan.count({ where: { creatorId: userId } }),
      db.report.count({ where: { reportedUserId: userId } }),
    ]);

  // Get review data
  const reviews = await db.planParticipantReview.findMany({
    where: { reviewedUserId: userId },
    select: {
      wasPresent: true,
      wasRespectful: true,
      profileSeemedReal: true,
      planWasReal: true,
    },
  });

  // Calculate scores
  let presenceScore = 0;
  let respectScore = 0;
  let realProfileScore = 0;
  let organizerScore = 0;

  // Presence score based on positive reviews
  const positivePresenceReviews = reviews.filter((r) => r.wasPresent === true).length;
  const totalPresenceReviews = reviews.filter((r) => r.wasPresent !== null).length;
  if (totalPresenceReviews > 0) {
    presenceScore = (positivePresenceReviews / totalPresenceReviews) * 100;
  }

  // Respect score based on respectful reviews
  const positiveRespectReviews = reviews.filter((r) => r.wasRespectful === true).length;
  const totalRespectReviews = reviews.filter((r) => r.wasRespectful !== null).length;
  if (totalRespectReviews > 0) {
    respectScore = (positiveRespectReviews / totalRespectReviews) * 100;
  }

  // Real profile score based on profile completion and reviews
  let profileCompletion = 0;
  if (user.image) profileCompletion += 20;
  if (user.username) profileCompletion += 20;
  if (user.name) profileCompletion += 20;
  if (user.bio) profileCompletion += 20;
  if (user.emailVerified) profileCompletion += 10;
  if (user.phoneVerified) profileCompletion += 10;

  const positiveProfileReviews = reviews.filter((r) => r.profileSeemedReal === true).length;
  const totalProfileReviews = reviews.filter((r) => r.profileSeemedReal !== null).length;
  if (totalProfileReviews > 0) {
    realProfileScore = (profileCompletion * 0.5) + ((positiveProfileReviews / totalProfileReviews) * 50);
  } else {
    realProfileScore = profileCompletion;
  }

  // Organizer score based on plans created and positive reviews
  const positivePlanReviews = reviews.filter((r) => r.planWasReal === true).length;
  const totalPlanReviews = reviews.filter((r) => r.planWasReal !== null).length;
  if (plansCreated > 0) {
    const planScore = Math.min(plansCreated * 10, 50); // Max 50 for number of plans
    const reviewScore = totalPlanReviews > 0 ? (positivePlanReviews / totalPlanReviews) * 50 : 25;
    organizerScore = planScore + reviewScore;
  }

  // Calculate overall outside score
  const baseScore = 50;
  const presenceWeight = 0.25;
  const respectWeight = 0.25;
  const profileWeight = 0.25;
  const organizerWeight = 0.25;

  let outsideScore =
    baseScore +
    presenceScore * presenceWeight +
    respectScore * respectWeight +
    realProfileScore * profileWeight +
    organizerScore * organizerWeight;

  // Apply penalties
  const reportsPenalty = reportsReceived * 10;
  outsideScore = Math.max(0, outsideScore - reportsPenalty);

  // Cap at 100
  outsideScore = Math.min(100, outsideScore);

  // Determine level
  let level = "Nouveau";
  if (outsideScore >= 90) level = "Ambassadeur local";
  else if (outsideScore >= 75) level = "Organisateur sérieux";
  else if (outsideScore >= 60) level = "Fiable";
  else if (outsideScore >= 40) level = "Actif";

  // Update trust profile
  await db.userTrustProfile.update({
    where: { userId },
    data: {
      outsideScore,
      presenceScore,
      respectScore,
      realProfileScore,
      organizerScore,
      plansJoined,
      plansCreated,
      validatedAttendances: positivePresenceReviews,
      positiveReviews: positiveRespectReviews + positiveProfileReviews + positivePlanReviews,
      reportsCount: reportsReceived,
      level,
      lastCalculatedAt: new Date(),
    },
  });

  return {
    outsideScore,
    presenceScore,
    respectScore,
    realProfileScore,
    organizerScore,
    level,
  };
}

export async function calculatePlanConfirmation(planId: string): Promise<{
  isCommunityConfirmed: boolean;
  confirmationScore: number;
}> {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: {
      participants: true,
      reviews: true,
      reports: true,
      creator: {
        select: {
          trustProfile: true,
        },
      },
    },
  });

  if (!plan) {
    return { isCommunityConfirmed: false, confirmationScore: 0 };
  }

  // Calculate confirmation score
  let confirmationScore = 50; // Base score

  // Positive reviews increase score
  const positiveReviews = plan.reviews.filter(
    (r) => r.planWasReal === true
  ).length;
  const totalReviews = plan.reviews.filter(
    (r) => r.planWasReal !== null
  ).length;

  if (totalReviews > 0) {
    confirmationScore += (positiveReviews / totalReviews) * 30;
  }

  // Multiple participants increase score
  if (plan.participants.length >= 3) {
    confirmationScore += 10;
  }

  // Low reports increase score
  if (plan.reports.length === 0) {
    confirmationScore += 10;
  }

  // Trusted organizer increases score
  if (plan.creator.trustProfile?.outsideScore && plan.creator.trustProfile.outsideScore >= 60) {
    confirmationScore += 10;
  }

  // Cap at 100
  confirmationScore = Math.min(100, confirmationScore);

  // Plan is confirmed if score >= 70 and has at least 2 positive reviews
  const isCommunityConfirmed =
    confirmationScore >= 70 && positiveReviews >= 2;

  // Update plan
  await db.plan.update({
    where: { id: planId },
    data: {
      isCommunityConfirmed,
      confirmationScore,
    },
  });

  return { isCommunityConfirmed, confirmationScore };
}
