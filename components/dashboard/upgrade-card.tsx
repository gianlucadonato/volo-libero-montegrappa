"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { UserRole } from "@/prisma/generated/enums";

export function UpgradeCard() {
	const t = useTranslations("UpgradeCard");
	const { data } = authClient.useSession();

	if (data?.user?.role === UserRole.USER) {
		return (
			<Card className="md:max-xl:rounded-none md:max-xl:border-none md:max-xl:shadow-none">
				<CardHeader className="md:max-xl:px-4">
					<CardTitle>{t("become_member")}</CardTitle>
					<CardDescription>{t("membership_description")}</CardDescription>
				</CardHeader>
				<CardContent className="md:max-xl:px-4">
					<Link href="/membership">
						<Button size="sm" className="w-full">
							{t("join_the_club")}
						</Button>
					</Link>
				</CardContent>
			</Card>
		);
	} else {
		return null;
	}
}
