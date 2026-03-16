"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";

export default function PurchaseSuccessCard() {
	const t = useTranslations("PurchaseSuccessCard");
	return (
		<Card className="mt-8">
			<CardHeader className="flex flex-col items-center justify-center text-center">
				<CardTitle>
					<div className="text-xl">{t("title")}</div>
				</CardTitle>
				<CardDescription>{t("description_2")}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center text-center">
				<div className="my-2 w-[250px]">
					<DotLottieReact
						src="https://lottie.host/e4830d71-8285-423f-b70f-7bd042bb0642/IXEK8Xdnz3.lottie"
						loop
						autoplay
					/>
				</div>
				<div className="mt-4 text-sm">{t("description")}</div>
				<div className="mt-4">
					<Link href="/profile">
						<Button variant="outline" size="sm">
							<span>{t("view_cards_action")}</span>
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
