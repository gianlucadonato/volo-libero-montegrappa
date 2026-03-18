"use client";

import { useTranslations } from "next-intl";
import { FaFemale, FaMale } from "react-icons/fa";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function GenderCard({
	maleCount,
	femaleCount,
}: {
	maleCount: number;
	femaleCount: number;
}) {
	const t = useTranslations("AdminPage");
	return (
		<Card>
			<CardContent className="flex flex-row items-center">
				<div className="flex-1">
					<div className="flex flex-row items-center justify-start space-y-0 pb-2 pt-6">
						<CardTitle className="text-sm font-medium">{t("male")}</CardTitle>
						<FaMale className="ml-2 size-4 text-muted-foreground" />
					</div>
					<div className="flex justify-start text-2xl font-bold">
						{maleCount}
					</div>
				</div>
				<div className="flex-1">
					<div className="flex flex-row items-center justify-end space-y-0 pb-2 pt-6">
						<CardTitle className="text-sm font-medium">{t("female")}</CardTitle>
						<FaFemale className="ml-2 size-4 text-muted-foreground" />
					</div>
					<div className="flex justify-end text-2xl font-bold">
						{femaleCount}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
