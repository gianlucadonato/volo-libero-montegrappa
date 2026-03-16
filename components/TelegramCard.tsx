"use client";

import Image from "next/image";
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

export default function TelegramCard() {
	const t = useTranslations("TelegramCard");
	return (
		<Card className="mt-8">
			<CardHeader className="flex flex-col items-center justify-center text-center">
				<CardTitle>
					<div className="text-xl">{t("title")}</div>
				</CardTitle>
				<CardDescription>{t("description")}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center text-center">
				<div className="my-2">
					<Image
						src="/telegram_qrcode.jpeg"
						alt="telegram qr code"
						width={170}
						height={170}
					/>
				</div>
				<div className="mt-4 text-sm">{t("scan_code")}</div>
				<div className="text-sm">{t("click_below")}</div>
				<div className="mt-4">
					<Link target="_blank" href="https://t.me/+bwfBbW2X0LthNDY0">
						<Button variant="outline" size="sm">
							<span>{t("join_group_action")}</span>
						</Button>
					</Link>
				</div>
			</CardContent>
		</Card>
	);
}
