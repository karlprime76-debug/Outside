import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planId } = body;

    if (!planId) {
      return new NextResponse("Plan ID missing", { status: 400 });
    }

    const plan = await db.plan.findUnique({
      where: { id: planId },
      include: { creator: { select: { stripeConnectId: true } } }
    });

    if (!plan || !plan.stripePriceId || !plan.creator.stripeConnectId) {
      return new NextResponse("Ce plan n'est pas disponible à la vente directe.", { status: 400 });
    }

    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Application fee is 10% or minimum 0.50€
    const amountInCents = Math.round((plan.ticketPrice || 0) * 100);
    const feeAmount = Math.max(50, Math.round(amountInCents * 0.1));

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.create({
      success_url: `${appUrl}/plans/${planId}?payment=success`,
      cancel_url: `${appUrl}/plans/${planId}?payment=cancelled`,
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: session.user.email!,
      metadata: {
        userId: session.user.id,
        planId: planId,
      },
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: {
          destination: plan.creator.stripeConnectId,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
