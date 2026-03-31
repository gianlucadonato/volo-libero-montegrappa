import { headers } from "next/headers";
import type Stripe from "stripe";
import { NEXT_YEAR } from "@/config/constants";
import { sendPaymentConfirmationEmail } from "@/emails/sendPaymentConfirmationEmail";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { Payment } from "@/prisma/generated/client";

export async function POST(req: Request) {
	const requestId = crypto.randomUUID();
	const log = logger.child({ requestId, route: "/api/stripe/webhooks" });
	const endTimer = metrics.httpDuration.startTimer({
		method: "POST",
		route: "/api/stripe/webhooks",
	});

	const body = await req.text();
	const requestHeaders = await headers();
	const signature = requestHeaders.get("Stripe-Signature");
	if (!signature) {
		endTimer();
		metrics.httpRequests.inc({
			method: "POST",
			route: "/api/stripe/webhooks",
			status: "400",
		});
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
		metrics.stripeWebhookErrors.inc();
		log.error({ err: error }, "stripe webhook signature verification failed");
		const message =
			error instanceof Error ? error.message : "Unknown webhook error";
		endTimer();
		metrics.httpRequests.inc({
			method: "POST",
			route: "/api/stripe/webhooks",
			status: "400",
		});
		return new Response(`Webhook Error: ${message}`, { status: 400 });
	}

	log.info({ eventType: event.type }, "stripe webhook received");
	metrics.stripeWebhookEvents.inc({ event_type: event.type });

	// Handle the event
	switch (event.type) {
		case "checkout.session.completed":
			await handleCheckoutSessionCompleted(event.data.object, log);
			break;
		case "charge.updated":
			await handleChargeUpdated(event.data.object, log);
			break;
		default:
			log.warn(
				{ eventType: event.type },
				"stripe webhook: unhandled event type",
			);
	}

	endTimer();
	metrics.httpRequests.inc({
		method: "POST",
		route: "/api/stripe/webhooks",
		status: "200",
	});
	return new Response(null, { status: 200 });
}

async function handleCheckoutSessionCompleted(
	session: Stripe.Checkout.Session,
	log: ReturnType<typeof logger.child>,
) {
	log.info({ sessionId: session.id }, "handling checkout.session.completed");
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
			log.info({ paymentId: payment.id, userId }, "payment created");
			metrics.paymentsCreated.inc();
			await createMembership(payment, log);
		}
	} catch (err) {
		log.error(
			{ err, sessionId: session.id },
			"checkout session handling failed",
		);
		throw new StripeAPIError("handleCheckoutSessionCompleted failed");
	}
}

async function createMembership(
	payment: Payment,
	log: ReturnType<typeof logger.child>,
) {
	const { userId, product: membershipId } = payment;
	if (!membershipId) {
		throw new Error("membershipId not found in payment");
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
	log.info(
		{ userMembershipId: userMembership.id, userId },
		"user membership created",
	);

	// Get Coupon code
	const coupon = await prisma.coupon.findFirst({
		where: { userId: null, year: NEXT_YEAR, type: "socio" },
	});
	if (!coupon) {
		log.warn({ userId }, "no available coupon found for new member");
		return;
	}
	const cp = await prisma.coupon.update({
		where: { id: coupon.id },
		data: { userId },
	});
	log.info({ couponId: cp.id, userId }, "coupon assigned to user");

	// Update user role to MEMBER.
	const user = await prisma.user.update({
		where: { id: userId },
		data: { role: "MEMBER" },
	});
	log.info({ userId: user.id }, "user role updated to MEMBER");

	// Send Confirmation email.
	await sendPaymentConfirmationEmail({
		user,
		payment,
		couponCode: coupon?.code,
	});
}

async function handleChargeUpdated(
	charge: Stripe.Charge,
	log: ReturnType<typeof logger.child>,
) {
	log.info(
		{ chargeId: charge.id, paymentIntent: charge.payment_intent },
		"handling charge.updated",
	);
	if (!charge.paid || !charge.payment_intent) {
		log.warn(
			{ chargeId: charge.id },
			"charge not paid or missing payment_intent, skipping",
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
		log.info(
			{ chargeId: charge.id, updatedCount: res.count },
			"payment updated with charge details",
		);
	} catch (err) {
		log.error({ err, chargeId: charge.id }, "charge update failed");
		throw new StripeAPIError("handleChargeUpdated failed");
	}
}

class StripeAPIError extends Error {
	constructor(message: string | undefined) {
		super(message);
		this.name = "StripeAPIError";
	}
}
