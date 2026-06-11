import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || (session.user.role !== "PRO" && session.user.role !== "ADMIN")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeConnectId: true, email: true }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    let accountId = user.stripeConnectId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'manual',
            },
          },
        },
      });

      accountId = account.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeConnectId: accountId }
      });
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.APP_URL}/pro/dashboard?stripe=refresh`,
      return_url: `${process.env.APP_URL}/api/stripe/callback?account_id=${accountId}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("[STRIPE_CONNECT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
