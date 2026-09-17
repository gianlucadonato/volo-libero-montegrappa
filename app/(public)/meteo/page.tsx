import { ArrowRight, Lock, MapIcon, Table2 } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { constructMetadata, siteConfig } from "@/config/site";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = constructMetadata({
	title: `Meteo - ${siteConfig.name}`,
	description:
		"Previsioni meteo per l'area del Montegrappa: mappe orarie navigabili e tabelle di previsione per i sei decolli.",
});

// Only the session is read, and just to label the cards: the hub itself holds
// no forecast data, so it can be rendered statically per request.
export const dynamic = "force-dynamic";

type MeteoSection = {
	href: string;
	icon: typeof MapIcon;
	title: string;
	description: string;
	cta: string;
};

export default async function MeteoPage() {
	const [user, t] = await Promise.all([
		getSessionUser(),
		getTranslations("MeteoPage"),
	]);

	const sections: MeteoSection[] = [
		{
			href: "/meteo/maps",
			icon: MapIcon,
			title: t("maps_card_title"),
			description: t("maps_card_description"),
			cta: t("maps_card_cta"),
		},
		{
			href: "/meteo/tables",
			icon: Table2,
			title: t("tables_card_title"),
			description: t("tables_card_description"),
			cta: t("tables_card_cta"),
		},
	];

	return (
		<div>
			<div className="overflow-hidden rounded font-mono">
				<div className="flex h-[20vh] flex-col bg-slate-50 bg-[url('/bg-montegrappa.webp')] bg-cover bg-top">
					<div
						style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
						className="flex h-full flex-col items-center justify-center px-2"
					>
						<h1 className="font-bold text-2xl text-white">
							{t("header_title")}
						</h1>
						<h3 className="pt-2 text-center text-sm text-white">
							{t("dashboard_description")}
						</h3>
					</div>
				</div>
			</div>

			<div className="container mb-16">
				<div className="mt-8 grid gap-4 sm:grid-cols-2">
					{sections.map((section) => (
						<MeteoSectionCard
							key={section.href}
							section={section}
							// The cards themselves stay public so the hub can advertise what
							// the club offers; the gate lives on the two pages behind them.
							// This only labels them, so a visitor knows before clicking.
							locked={!user}
							lockedLabel={t("members_only")}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function MeteoSectionCard({
	section,
	locked,
	lockedLabel,
}: {
	section: MeteoSection;
	locked: boolean;
	lockedLabel: string;
}) {
	const Icon = section.icon;

	return (
		<Link
			href={section.href}
			className={cn(
				"group flex flex-col gap-3 rounded-xl border bg-card p-6 transition-colors",
				"hover:border-foreground/20 hover:bg-accent/50",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			)}
		>
			<div className="flex items-center gap-3">
				<div className="rounded-full bg-muted p-2.5">
					<Icon className="size-5 text-foreground" />
				</div>
				<h2 className="font-semibold text-lg">{section.title}</h2>
				{locked && (
					<span className="ml-auto flex items-center gap-1 text-muted-foreground text-xs">
						<Lock className="size-3" />
						{lockedLabel}
					</span>
				)}
			</div>

			<p className="text-muted-foreground text-sm leading-relaxed">
				{section.description}
			</p>

			<span className="mt-auto flex items-center gap-1.5 pt-1 font-medium text-sm">
				{section.cta}
				<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
			</span>
		</Link>
	);
}
