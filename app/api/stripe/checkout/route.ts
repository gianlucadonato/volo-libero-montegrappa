import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { NEXT_YEAR } from "@/config/constants";
import { env } from "@/env";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const POST = async (req: Request) => {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) {
		return new Response("Not authenticated", { status: 401 });
	}

	try {
		const data = await req.json();
		const locale = data.locale;

		const membership = await prisma.membership.findFirst({
			where: { year: NEXT_YEAR },
		});
		if (!membership) {
			console.error("🐞 > membership not found!");
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
		return NextResponse.json({ result: checkoutSession, ok: true });
	} catch (error) {
		console.log(error);
		return new NextResponse("Internal Server", { status: 500 });
	}
};
