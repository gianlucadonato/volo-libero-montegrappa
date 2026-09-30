"use client";

import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import { CreditCardIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useState } from "react";
import Login from "@/components/auth/Login";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Locale } from "@/i18n/config";

export default function PurchaseButton({
	isDisabled,
	isUser,
}: {
	isDisabled?: boolean;
	isUser?: boolean;
}) {
	const t = useTranslations("PurchaseButton");
	const locale = useLocale();
	const [isLoading, setIsLoading] = useState(false);
	const [open, setOpen] = useState(false);

	const handlePurchase = async () => {
		if (!isUser) {
			setOpen(true);
			return;
		}
		setIsLoading(true);
		const stripe = await loadStripe(
			process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string,
		);
		if (!stripe) {
			setIsLoading(false);
			return;
		}
		try {
			const { data } = await axios.post("/api/stripe/checkout", {
				locale: locale as Locale,
			});
			if (!data.ok) throw new Error("Something went wrong");
			posthog.capture("membership_checkout_started", {
				locale,
			});
			// await stripe.redirectToCheckout({
			// 	sessionId: data.result.id,
			// });
			// TODO: redirect to checkout page
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Button
				onClick={handlePurchase}
				disabled={isDisabled || isLoading}
				size="lg"
				className="rounded-lg bg-linear-to-r from-amber-500 to-amber-600 px-8 py-4 font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-amber-600 hover:to-amber-700 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 disabled:hover:scale-100"
			>
				{isLoading ? (
					t("redirecting_to_checkout")
				) : (
					<>
						<CreditCardIcon className="mr-2 size-4" /> {t("submit")}
					</>
				)}
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent aria-label="Login dialog">
					<Login />
				</DialogContent>
			</Dialog>
		</>
	);
}
