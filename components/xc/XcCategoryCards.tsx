"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { IoIosMedal } from "react-icons/io";
import { Button } from "@/components/ui/button";

const levels = [
	{
		key: "basic" as const,
		href: "/xc/basic",
		color: "#CD7F32",
		textColor: "#CD7F32",
	},
	{
		key: "intermediate" as const,
		href: "/xc/intermediate",
		color: "#C0C0C0",
		textColor: "#808080",
	},
	{
		key: "advanced" as const,
		href: "/xc/advanced",
		color: "#FFD700",
		textColor: "#B8960C",
	},
];

export default function XcCategoryCards() {
	const t = useTranslations("XcMontegrappaPage");

	return (
		<section className="px-4 py-16">
			<div className="container mx-auto max-w-4xl">
				<div className="mb-10 text-center">
					<h2 className="font-heading text-2xl highlight uppercase">
						{t("categoryCards.title")}
					</h2>
					<p className="mt-2 text-muted-foreground">
						{t("categoryCards.subtitle")}
					</p>
				</div>
			</div>
			<div className="container mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
				{levels.map(({ key, href, color, textColor }) => (
					<Link
						key={key}
						href={href}
						className="group flex flex-col items-center rounded-xl border-2 bg-white p-6 shadow-sm transition-all hover:shadow-md"
						style={{
							borderColor: `${color}4D`,
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = color;
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = `${color}4D`;
						}}
					>
						<div
							className="mb-4 flex size-16 items-center justify-center rounded-full"
							style={{ backgroundColor: `${color}1A` }}
						>
							<IoIosMedal className="size-10" style={{ color }} />
						</div>
						<h3 className="font-heading text-center text-lg">
							{t(`levels.${key}.title`)}
						</h3>
						<p className="mt-2 text-center text-sm text-muted-foreground">
							{t(`levels.${key}.description`)}
						</p>
						<Button
							variant="outline"
							className="mt-4 group-hover:text-white"
							style={{
								borderColor: `${color}80`,
								color: textColor,
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.backgroundColor = color;
								e.currentTarget.style.color = "white";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.backgroundColor = "";
								e.currentTarget.style.color = textColor;
							}}
						>
							{t("levels.viewTasks")}
							<ArrowRight className="ml-1 size-4" />
						</Button>
					</Link>
				))}
			</div>
		</section>
	);
}
