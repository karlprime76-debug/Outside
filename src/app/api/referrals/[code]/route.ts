import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Find the referral invite
    const referral = await db.referralInvite.findUnique({
      where: { code },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    if (!referral) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const session = await auth();

    // If user is logged in, check if they can accept this referral
    if (session?.user?.id) {
      // User cannot refer themselves
      if (referral.inviterId === session.user.id) {
        return NextResponse.json(
          { error: "You cannot accept your own referral" },
          { status: 400 }
        );
      }

      // Check if already accepted
      if (referral.acceptedUserId) {
        return NextResponse.json(
          { error: "This referral has already been accepted" },
          { status: 400 }
        );
      }

      // Check if user already has an accepted referral
      const existingReferral = await db.referralInvite.findFirst({
        where: { acceptedUserId: session.user.id },
      });

      if (existingReferral) {
        return NextResponse.json(
          { error: "You have already accepted a referral" },
          { status: 400 }
        );
      }

      // Accept the referral
      await db.referralInvite.update({
        where: { id: referral.id },
        data: {
          acceptedUserId: session.user.id,
          acceptedAt: new Date(),
        },
      });

      // Award badge to inviter (if first referral)
      const inviterReferralCount = await db.referralInvite.count({
        where: {
          inviterId: referral.inviterId,
          acceptedUserId: { not: null },
        },
      });

      if (inviterReferralCount === 1) {
        // Award "Premier invité" badge
        const badge = await db.badge.findUnique({
          where: { key: "FIRST_INVITE" },
        });

        if (badge) {
          await db.userBadge.upsert({
            where: {
              userId_badgeId: {
                userId: referral.inviterId,
                badgeId: badge.id,
              },
            },
            create: {
              userId: referral.inviterId,
              badgeId: badge.id,
            },
            update: {},
          });
        }
      }

      return NextResponse.json({
        success: true,
        inviter: referral.inviter,
      });
    }

    // User not logged in - return referral info for display
    return NextResponse.json({
      success: true,
      inviter: referral.inviter,
      requiresAuth: true,
    });
  } catch (error) {
    console.error("Referral acceptance error:", error);
    return NextResponse.json(
      { error: "Failed to process referral" },
      { status: 500 }
    );
  }
}
