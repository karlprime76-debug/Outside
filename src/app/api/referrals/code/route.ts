import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate or get existing referral code
    let referralCode = user.referralCode;

    if (!referralCode) {
      // Generate a unique referral code
      const code = generateReferralCode();
      
      // Check if code already exists
      const existing = await db.referralInvite.findUnique({
        where: { code },
      });

      if (existing) {
        // If code exists, generate a new one
        referralCode = generateReferralCode();
      } else {
        referralCode = code;
      }

      // Update user with referral code
      await db.user.update({
        where: { id: user.id },
        data: { referralCode },
      });
    }

    // Create referral link
    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://outside.app'}/invite/${referralCode}`;

    // Get referral stats
    const invites = await db.referralInvite.findMany({
      where: { inviterId: user.id },
      include: {
        acceptedUser: {
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

    const acceptedCount = invites.filter((i) => i.acceptedAt).length;
    const pendingCount = invites.filter((i) => !i.acceptedAt).length;

    return NextResponse.json({
      referralCode,
      referralLink,
      stats: {
        total: invites.length,
        accepted: acceptedCount,
        pending: pendingCount,
      },
      invites: invites.map((i) => ({
        id: i.id,
        code: i.code,
        invitedEmail: i.invitedEmail,
        invitedPhone: i.invitedPhone,
        acceptedAt: i.acceptedAt,
        acceptedUser: i.acceptedUser,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    console.error("[REFERRAL_CODE_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
