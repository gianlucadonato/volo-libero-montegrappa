import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { ArrowLeft, Clock, Lock } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import getElmeteoRuns from "@/actions/getElmeteoRuns";
import { MeteoMaps } from "@/components/meteo/MeteoMaps";
import {
	RefreshButton,
	UploadStatusDot,
} from "@/components/meteo/RefreshStatus";
import { buttonVariants } from "@/components/ui/button";
import { constructMetadata, siteConfig } from "@/config/site";
import { withCallbackUrl } from "@/helpers/authRedirect";
import { elmeteoHistoryDays } from "@/lib/elmeteo-run";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: `Meteo - ${siteConfig.name}`,
	description:
		"Previsioni meteo per l'area del Montegrappa: termiche, vento, base delle nuvole e precipitazioni, aggiornate 4 volte al giorno.",
});

// The page reads the latest report, so it must not be cached at build time.
export const dynamic = "force-dynamic";

/**
 * Hour the model was run at, in UTC.
 *
 * date-fns formats in the server's local zone, so the hour has to be built
 * explicitly in UTC to match the "Run ... UTC" caption burned into the maps.
 * The clock is forced to 24 hours for the same reason: an English visitor
 * shown "6:50 AM" beside an image captioned "06:50" would be left comparing
 * two times that do not look like the same one.
 */
function formatRunHour(locale: string, at: Date) {
	return new Intl.DateTimeFormat(locale, {
		timeZone: "UTC",
		hourCycle: "h23",
		hour: "2-digit",
		minute: "2-digit",
	}).format(at);
}

// Joined with Intl rather than written into the message, so the separator
// before the last item follows the language ("e" / "and") without either
// translation having to spell the list out.
const updateTimes = ["6:50", "9:50", "18:50", "21:50"];

// The window is configured in days, but pilots think in weeks like the bucket
// retention does, so the caption spells out both. Rounded, so a window that is
// not a whole number of weeks still reads as a sentence.
const historyHours = elmeteoHistoryDays * 24;
const historyWeeks = Math.round(elmeteoHistoryDays / 7);

export default async function MeteoPage() {
	const [elmeteo, user, t, tMaps, locale] = await Promise.all([
		getElmeteoRuns(),
		getSessionUser(),
		getTranslations("MeteoPage"),
		getTranslations("MeteoPage.Maps"),
		getLocale(),
	]);

	// The timestamps below carry a date, and 17/09 and 09/17 are both readable
	// dates: the order has to follow the UI language rather than stay pinned to
	// the Italian one. The clock stays 24-hour, like the maps' own captions.
	const dateLocale = locale === "en" ? enUS : itLocale;

	const run = elmeteo?.latest;
	// A failing uploader is the only case where the maps on screen are older than
	// the last thing that happened, so it outranks the run's own legs.
	const failedUpload = elmeteo?.failedUpload;

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
				<div className="mt-6">
					<Link
						href="/meteo"
						className={buttonVariants({ variant: "ghost", size: "sm" })}
					>
						<ArrowLeft className="size-4" />
						{tMaps("back")}
					</Link>
				</div>

				<div className="mt-2 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-3">
						{/* Aligned to the first line of the block rather than to the box:
						    the icon belongs to the timestamp, not to the paragraphs under
						    it. */}
						<div className="flex h-5 shrink-0 items-center">
							<RefreshButton />
						</div>
						<div>
							<p className="font-medium text-sm">
								{run?.updatedAt ? (
									<>
										{tMaps("last_update")}{" "}
										<span className="tabular-nums">
											{format(run.updatedAt, "P HH:mm:ss", {
												locale: dateLocale,
											})}
										</span>
									</>
								) : (
									tMaps("no_update")
								)}
								{/* Same row as the timestamp above: the dot reports whether
								    that upload had any failing leg, and no report at all is
								    not a success either. */}
								<UploadStatusDot
									error={failedUpload !== undefined || (run?.error ?? true)}
								/>
							</p>
							{failedUpload && (
								<p className="text-destructive text-xs">
									{tMaps.rich("upload_failed", {
										count: failedUpload.count,
										date: format(failedUpload.at, "P HH:mm", {
											locale: dateLocale,
										}),
										time: (chunks) => (
											<span className="tabular-nums">{chunks}</span>
										),
									})}
								</p>
							)}
							<p className="text-muted-foreground text-xs">
								{tMaps("model_run", {
									time: run
										? `${formatRunHour(locale, run.runStart)} UTC`
										: "—",
								})}
							</p>
							<p className="text-muted-foreground text-xs">
								{tMaps("history", {
									hours: historyHours,
									weeks: historyWeeks,
								})}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 sm:max-w-sm">
						<Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<p className="text-muted-foreground text-xs leading-snug">
							{tMaps("update_schedule", {
								times: new Intl.ListFormat(locale, {
									type: "conjunction",
								}).format(updateTimes),
							})}
						</p>
					</div>
				</div>

				<div className="mt-6">
					{!elmeteo ? (
						<EmptyState
							title={t("no_run_title")}
							description={t("no_run_description")}
						/>
					) : user ? (
						<MeteoMaps
							runs={elmeteo.runs.map(({ folder, runStart }) => ({
								folder,
								runStartIso: runStart.toISOString(),
							}))}
							// Open on the hour closest to now, so the first thing shown is
							// the present.
							initialAtIso={new Date().toISOString()}
						/>
					) : (
						<LoginGate
							title={t("maps_locked_title")}
							description={t("maps_locked_description")}
							login={tMaps("login")}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

function LoginGate({
	title,
	description,
	login,
}: {
	title: string;
	description: string;
	login: string;
}) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-16 text-center">
			<div className="rounded-full bg-muted p-3">
				<Lock className="size-5 text-muted-foreground" />
			</div>
			<div className="max-w-md space-y-1">
				<p className="font-medium">{title}</p>
				<p className="text-muted-foreground text-sm">{description}</p>
			</div>
			{/* Carry the callback so logging in from here comes back to the maps
			    instead of landing on the profile or on the hub. */}
			<Link
				href={withCallbackUrl("/login", "/meteo/maps")}
				className={buttonVariants()}
			>
				{login}
			</Link>
		</div>
	);
}

function EmptyState({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="rounded-xl border border-dashed px-6 py-16 text-center">
			<p className="font-medium">{title}</p>
			<p className="mt-1 text-muted-foreground text-sm">{description}</p>
		</div>
	);
}
