import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event;

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[STRIPE_WEBHOOK_ERROR]", message);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      return new NextResponse("Webhook Error: Missing metadata", { status: 400 });
    }

    try {
      const amountTotal = session.amount_total;
      const currency = session.currency;
      await db.$transaction([
        db.ticket.create({
          data: {
            userId,
            planId,
            stripeSessionId: session.id,
            amount: amountTotal ? amountTotal / 100 : 0,
            currency: currency ?? "eur",
            status: "COMPLETED",
          }
        }),
        db.planParticipant.upsert({
          where: {
            planId_userId: {
              planId,
              userId
            }
          },
          update: {
            status: "CONFIRMED",
            attendance: "GOING"
          },
          create: {
            planId,
            userId,
            status: "CONFIRMED",
            attendance: "GOING"
          }
        })
      ]);
      console.log("[STRIPE_WEBHOOK] Ticket confirmed", { userId, planId });
    } catch (error) {
      console.error("[STRIPE_WEBHOOK_DB_ERROR]", error);
      return new NextResponse("Internal DB Error", { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
