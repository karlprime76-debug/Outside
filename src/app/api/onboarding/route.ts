import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const progress = await db.onboardingProgress.findUnique({
      where: { userId: user.id },
    });

    if (!progress) {
      // Create initial progress
      const newProgress = await db.onboardingProgress.create({
        data: {
          userId: user.id,
          hasProfilePhoto: !!user.image,
          hasActiveCity: !!user.activeCityId,
        },
      });
      return NextResponse.json({ progress: newProgress });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[ONBOARDING_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { field, value } = body;

    if (!field) {
      return NextResponse.json({ error: "Field is required" }, { status: 400 });
    }

    const validFields = [
      "hasProfilePhoto",
      "hasActiveCity",
      "hasFollowedUsers",
      "hasSavedPlan",
      "hasViewedMoment",
      "hasActivatedStatus",
    ];

    if (!validFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const progress = await db.onboardingProgress.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        [field]: value,
      },
      update: {
        [field]: value,
      },
    });

    // Check if all steps are completed
    const allCompleted =
      progress.hasProfilePhoto &&
      progress.hasActiveCity &&
      progress.hasFollowedUsers &&
      progress.hasSavedPlan &&
      progress.hasViewedMoment;

    if (allCompleted && !progress.completedAt) {
      // Award "Profil lancé" badge
      const badge = await db.badge.findUnique({ where: { key: "PROFILE_LAUNCHED" } });
      if (badge) {
        await db.userBadge.create({
          data: {
            userId: user.id,
            badgeId: badge.id,
          },
        });
      }

      // Mark as completed
      const updatedProgress = await db.onboardingProgress.update({
        where: { userId: user.id },
        data: { completedAt: new Date() },
      });
      return NextResponse.json({ progress: updatedProgress, completed: true });
    }

    return NextResponse.json({ progress, completed: !!progress.completedAt });
  } catch (error) {
    console.error("[ONBOARDING_UPDATE_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
