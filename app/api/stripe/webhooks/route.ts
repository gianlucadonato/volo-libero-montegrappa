import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { NEXT_YEAR } from "@/config/constants";
import { sendPaymentConfirmationEmail } from "@/emails/sendPaymentConfirmationEmail";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { Payment } from "@/prisma/generated/client";

export async function POST(req: Request) {
  const body = await req.text();
  const requestHeaders = await headers();
  const signature = requestHeaders.get("Stripe-Signature");
  if (!signature) {
    return new Response("Webhook Error: Missing Stripe-Signature header", {
      status: 400,
    });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("🐞 > error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "charge.updated":
      await handleChargeUpdated(event.data.object);
      break;
    default:
      console.error(`Stripe webhook: Unhandled event type ${event.type}`);
  }

  return new Response(null, { status: 200 });
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  console.log("🐞 > handleCheckoutSessionCompleted:", session.id);
  try {
    if (session.status === "complete") {
      const userId = String(session.metadata?.userId);
      const membershipId = String(session.metadata?.membershipId);

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          userId,
          paymentMethod: "card",
          amount: Number(session.amount_total),
          slug: String(session.metadata?.slug),
          description: `Tesseramento VLM ${NEXT_YEAR}`,
          product: membershipId,
          stripePaymentIntentId: String(session.payment_intent),
          stripeCheckoutSessionId: session.id,
        },
      });
      console.log("🐞 > payment created!", payment);
      await createMembership(payment);
    }
  } catch (err) {
    Sentry.captureException(err);
    throw new StripeAPIError("handleCheckoutSessionCompleted failed");
  }
}

async function createMembership(payment: Payment) {
  const { userId, product: membershipId } = payment;
  if (!membershipId) {
    throw new Error("🐞 > membershipId not found in payment!");
  }
  // Create userMembership
  const userMembership = await prisma.userMembership.create({
    data: {
      userId,
      membershipId,
      year: NEXT_YEAR,
      status: "active",
      description: `Club Volo Libero Montegrappa ${NEXT_YEAR}`,
      validFrom: new Date(), // now
      validUntil: new Date(NEXT_YEAR, 11, 31), // December 31st of NEXT_YEAR
    },
  });
  console.log("🐞 > userMembership created!", userMembership);

  // Get Coupon code
  const coupon = await prisma.coupon.findFirst({
    where: { userId: null, year: NEXT_YEAR, type: "socio" },
  });
  if (!coupon) {
    console.error("🐞 > coupon not found!");
    return;
  }
  const cp = await prisma.coupon.update({
    where: { id: coupon.id },
    data: { userId },
  });
  console.log("🐞 > coupon assigned to user:", cp);

  // Update user role to MEMBER.
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: "MEMBER" },
  });
  console.log("🐞 > user role updated!", user.id);

  // Send Confirmation email.
  await sendPaymentConfirmationEmail({
    user,
    payment,
    couponCode: coupon?.code,
  });
}

async function handleChargeUpdated(charge: Stripe.Charge) {
  console.log("🐞 > handleChargeUpdated:", charge.id, charge.payment_intent);
  if (!charge.paid || !charge.payment_intent) {
    console.log(
      "🐞 > handleChargeUpdated: charge not paid or payment_intent not found",
    );
    return;
  }
  try {
    const res = await prisma.payment.updateMany({
      where: {
        stripePaymentIntentId: charge.payment_intent as string,
      },
      data: {
        stripeChargeId: charge.id,
        stripePaymentMethod:
          charge.payment_method_details?.card?.wallet?.type ||
          charge.payment_method_details?.type,
        stripeReceiptUrl: charge.receipt_url,
      },
    });
    console.log("🐞 > charge order updated!", res);
  } catch (err) {
    Sentry.captureException(err);
    throw new StripeAPIError("handleChargeUpdated failed");
  }
}

class StripeAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "StripeAPIError";
  }
}
