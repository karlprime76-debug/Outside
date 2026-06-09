import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Find the referral invite by code
    const invite = await db.referralInvite.findUnique({
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

    if (!invite) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      inviter: invite.inviter,
    });
  } catch (error) {
    console.error("[REFERRAL_LOOKUP_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const { code } = await params;

    // Find the referral invite by code
    const invite = await db.referralInvite.findUnique({
      where: { code },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    // Check if already accepted
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "Referral already accepted" }, { status: 400 });
    }

    // Don't allow self-referral
    if (invite.inviterId === user.id) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Update invite with accepted user
    const updatedInvite = await db.referralInvite.update({
      where: { id: invite.id },
      data: {
        acceptedUserId: user.id,
        acceptedAt: new Date(),
      },
    });

    // Award badge to inviter if this is their first referral
    const inviterInviteCount = await db.referralInvite.count({
      where: {
        inviterId: invite.inviterId,
        acceptedAt: { not: null },
      },
    });

    if (inviterInviteCount === 1) {
      const badge = await db.badge.findUnique({ where: { key: "FIRST_INVITE" } });
      if (badge) {
        await db.userBadge.create({
          data: {
            userId: invite.inviterId,
            badgeId: badge.id,
          },
        });
      }
    }

    // Award badge to referred user
    const badge = await db.badge.findUnique({ where: { key: "REFERRED_BY_FRIEND" } });
    if (badge) {
      await db.userBadge.create({
        data: {
          userId: user.id,
          badgeId: badge.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      invite: { id: updatedInvite.id, code: updatedInvite.code, acceptedAt: updatedInvite.acceptedAt },
    });
  } catch (error) {
    console.error("[REFERRAL_ACCEPT_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
