import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { NEXT_YEAR } from "@/config/constants";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const POST = async (req: Request) => {
	const requestId = crypto.randomUUID();
	const log = logger.child({ requestId, route: "/api/stripe/checkout" });
	const endTimer = metrics.httpDuration.startTimer({
		method: "POST",
		route: "/api/stripe/checkout",
	});

	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) {
		endTimer();
		metrics.httpRequests.inc({
			method: "POST",
			route: "/api/stripe/checkout",
			status: "401",
		});
		return new Response("Not authenticated", { status: 401 });
	}

	try {
		const data = await req.json();
		const locale = data.locale;

		const membership = await prisma.membership.findFirst({
			where: { year: NEXT_YEAR },
		});
		if (!membership) {
			log.error(
				{ userId: session.user.id },
				"membership not found for checkout",
			);
			endTimer();
			metrics.httpRequests.inc({
				method: "POST",
				route: "/api/stripe/checkout",
				status: "500",
			});
			return new NextResponse("Internal Server", { status: 500 });
		}

		const checkoutSession: Stripe.Checkout.Session =
			await stripe.checkout.sessions.create({
				line_items: [
					{
						price: membership.stripePriceId as string,
						quantity: 1,
					},
				],
				mode: "payment",
				success_url: `${env.NEXT_PUBLIC_APP_URL}/membership/success`,
				cancel_url: `${env.NEXT_PUBLIC_APP_URL}/membership`,
				customer_email: session.user.email?.toString(),
				locale,
				metadata: {
					userId: session.user.id.toString(),
					membershipId: membership.id.toString(),
					slug: membership.slug,
				},
			});
		log.info(
			{ userId: session.user.id, checkoutSessionId: checkoutSession.id },
			"stripe checkout session created",
		);
		endTimer();
		metrics.httpRequests.inc({
			method: "POST",
			route: "/api/stripe/checkout",
			status: "200",
		});
		return NextResponse.json({ result: checkoutSession, ok: true });
	} catch (error) {
		log.error(
			{ err: error, userId: session.user.id },
			"stripe checkout session creation failed",
		);
		endTimer();
		metrics.httpRequests.inc({
			method: "POST",
			route: "/api/stripe/checkout",
			status: "500",
		});
		return new NextResponse("Internal Server", { status: 500 });
	}
};
