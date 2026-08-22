import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getXcFlight } from "@/actions/xc/getXcFlight";
import { DiceBearAvatar } from "@/components/DiceBearAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import XcPilotFlightPanel from "@/components/xc/XcPilotFlightPanel";
import { constructMetadata, siteConfig } from "@/config/site";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const data = await getXcFlight(id);

	if (!data) {
		return constructMetadata({
			title: `Volo - XC Montegrappa - ${siteConfig.name}`,
			description: "Dettaglio volo XC Montegrappa",
			noIndex: true,
		});
	}

	const pilotName = `${data.pilot.firstName} ${data.pilot.lastName}`;

	return constructMetadata({
		title: `${data.flight.task.name} - ${pilotName} - ${siteConfig.name}`,
		description: `Volo di ${pilotName} sulla task ${data.flight.task.name} - XC Montegrappa ${data.edition.title}`,
		// Same treatment as the pilot profile: reachable by link, but a page
		// carrying a pilot's name and GPS track stays out of search engines.
		noIndex: true,
	});
}

export default async function XcFlightPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const data = await getXcFlight(id);
	if (!data) notFound();

	const { pilot, edition, flight } = data;
	const [t, tCat, tProfile, locale] = await Promise.all([
		getTranslations("XcFlightPage"),
		getTranslations("XcCategoryPage"),
		getTranslations("XcPilotProfilePage"),
		getLocale(),
	]);

	const pilotName = `${pilot.firstName} ${pilot.lastName}`;
	const level = flight.task.category.toLowerCase();
	const flownOn = new Date(flight.stats?.startTime ?? flight.createdAt);
	const flownOnLabel = Number.isNaN(flownOn.getTime())
		? null
		: flownOn.toLocaleDateString(locale, { dateStyle: "medium" });

	return (
		<div className="min-h-screen bg-linear-to-b from-indigo-50 to-white">
			<div className="mx-auto max-w-5xl px-4 py-8">
				<div className="mb-6">
					<Link href={`/xc/users/${pilot.id}?edition=${flight.editionId}`}>
						<Button variant="outline">
							<ArrowLeft className="mr-2 size-4" />
							{t("back")}
						</Button>
					</Link>
				</div>

				<div className="mb-6 overflow-hidden rounded-2xl bg-linear-to-b from-indigo-600 to-indigo-800 px-6 py-6 shadow-xl">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<Link
							href={`/xc/users/${pilot.id}?edition=${flight.editionId}`}
							className="flex items-center gap-3 transition-opacity hover:opacity-80"
						>
							<DiceBearAvatar
								seed={pilotName}
								alt={pilotName}
								className="size-14 shrink-0 ring-2 ring-white/30"
							/>
							<div className="min-w-0">
								<p className="text-xs uppercase tracking-widest text-indigo-200">
									{t("pilot")}
								</p>
								<p className="truncate font-heading text-lg font-bold uppercase text-white">
									{pilotName}
								</p>
							</div>
						</Link>

						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">
								{tCat(`categories.${level}.short`)}
							</Badge>
							<Badge className="bg-amber-400 text-amber-950 hover:bg-amber-400">
								{flight.pointsAwarded} {tProfile("flights.points")}
							</Badge>
							<span className="text-xs text-indigo-100">{edition.title}</span>
						</div>
					</div>

					<div className="mt-5">
						<h1 className="font-heading text-2xl font-bold text-white">
							{flight.task.name}
						</h1>
						<div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-indigo-100">
							{flownOnLabel && (
								<span className="flex items-center gap-1.5">
									<CalendarDays className="size-4" />
									{flownOnLabel}
								</span>
							)}
							<Link
								href={`/xc/tasks/${flight.task.id}`}
								className="flex items-center gap-1.5 underline underline-offset-2 transition-colors hover:text-white"
							>
								<MapPin className="size-4" />
								{t("viewTask")} · {flight.task.slug}
							</Link>
						</div>
					</div>
				</div>

				<XcPilotFlightPanel flight={flight} />
			</div>
		</div>
	);
}
