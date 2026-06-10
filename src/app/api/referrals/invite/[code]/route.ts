import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { acceptReferralForUser, findInviterByCode } from "@/lib/referral";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const inviter = await findInviterByCode(code);

    if (!inviter) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    return NextResponse.json({ valid: true, inviter });
  } catch (error) {
    console.error("[REFERRAL_LOOKUP_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

    const { code } = await params;
    const result = await acceptReferralForUser(code, user.id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REFERRAL_ACCEPT_ERROR]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
