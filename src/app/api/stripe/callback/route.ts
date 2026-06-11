import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("account_id");

    if (!accountId) {
      return new NextResponse("Account ID missing", { status: 400 });
    }

    const account = await stripe.accounts.retrieve(accountId);

    if (account.details_submitted) {
      await prisma.user.updateMany({
        where: { stripeConnectId: accountId },
        data: { stripeOnboardingComplete: true }
      });
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/pro/dashboard?stripe=success`);
  } catch (error) {
    console.error("[STRIPE_CALLBACK]", error);
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/pro/dashboard?stripe=error`);
  }
}
