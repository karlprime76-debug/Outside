import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureUserReferralCode, getReferralStats } from "@/lib/referral";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, referralLink } = await ensureUserReferralCode(user.id);
    const stats = await getReferralStats(user.id);

    return NextResponse.json({
      referralCode: code,
      referralLink,
      stats: {
        total: stats.total,
        accepted: stats.accepted,
        pending: stats.pending,
      },
      invites: stats.invites,
    });
  } catch (error) {
    console.error("[REFERRAL_CODE_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
