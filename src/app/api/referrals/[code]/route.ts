import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { acceptReferralForUser, findInviterByCode } from "@/lib/referral";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const inviter = await findInviterByCode(code);

    if (!inviter) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const session = await auth();

    if (session?.user?.id) {
      if (inviter.id === session.user.id) {
        return NextResponse.json({ error: "You cannot accept your own referral" }, { status: 400 });
      }

      const result = await acceptReferralForUser(code, session.user.id);
      if (!result.ok && !result.alreadyLinked) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        inviter,
        requiresAuth: false,
        alreadyLinked: result.alreadyLinked ?? false,
      });
    }

    return NextResponse.json({ success: true, inviter, requiresAuth: true });
  } catch (error) {
    console.error("Referral acceptance error:", error);
    return NextResponse.json({ error: "Failed to process referral" }, { status: 500 });
  }
}
