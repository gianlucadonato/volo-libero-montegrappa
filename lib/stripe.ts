import Stripe from "stripe";

import { env } from "@/env";

export const stripe = new Stripe(env.STRIPE_API_SECRET, {
	apiVersion: "2026-10-28.endive",
	typescript: true,
});
