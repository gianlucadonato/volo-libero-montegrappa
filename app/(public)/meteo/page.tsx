import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Clock, Lock } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import getElmeteoRuns from "@/actions/getElmeteoRuns";
import { MeteoMaps } from "@/components/meteo/MeteoMaps";
import { RefreshStatus } from "@/components/meteo/RefreshStatus";
import { buttonVariants } from "@/components/ui/button";
import { constructMetadata, siteConfig } from "@/config/site";
import { elmeteoHistoryDays } from "@/lib/elmeteo-run";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: `Meteo - ${siteConfig.name}`,
	description:
		"Previsioni meteo per l'area del Montegrappa: termiche, vento, base delle nuvole e precipitazioni, aggiornate 4 volte al giorno.",
});

// The page reads the latest report, so it must not be cached at build time.
export const dynamic = "force-dynamic";

// date-fns formats in the server's local zone, so the run hour has to be built
// explicitly in UTC to match the "Run ... UTC" caption burned into the maps.
const runHourUTC = new Intl.DateTimeFormat("it-IT", {
	timeZone: "UTC",
	hour: "2-digit",
	minute: "2-digit",
});

const updateTimes = "6:50, 9:50, 18:50 e 21:50";

// The window is configured in days, but pilots think in weeks like the bucket
// retention does, so the caption spells out both. Rounded, so a window that is
// not a whole number of weeks still reads as a sentence.
const historyHours = elmeteoHistoryDays * 24;
const historyWeeks = Math.round(elmeteoHistoryDays / 7);
const historyWeeksLabel = `${historyWeeks} settiman${historyWeeks === 1 ? "a" : "e"}`;

export default async function MeteoPage() {
	const [elmeteo, user, t] = await Promise.all([
		getElmeteoRuns(),
		getSessionUser(),
		getTranslations("MeteoPage"),
	]);

	const run = elmeteo?.latest;

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
				<div className="mt-8 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-3">
						{/* No report at all is not a success: the dot stays red rather
						    than claiming a healthy uploader on an empty page. */}
						<RefreshStatus error={elmeteo?.lastAttempt.error ?? true} />
						<div>
							<p className="font-medium text-sm">
								{run?.updatedAt ? (
									<>
										Ultimo aggiornamento:{" "}
										<span className="tabular-nums">
											{format(run.updatedAt, "dd/MM/yyyy HH:mm:ss", {
												locale: it,
											})}
										</span>
									</>
								) : (
									"Nessun aggiornamento disponibile"
								)}
							</p>
							<p className="text-muted-foreground text-xs">
								Modello elaborato alle{" "}
								{run ? `${runHourUTC.format(run.runStart)} UTC` : "—"},
								previsione oraria fino a 48 ore.
							</p>
							<p className="text-muted-foreground text-xs">
								Navigabili anche le {historyHours} ore precedenti (
								{historyWeeksLabel}).
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3 sm:max-w-sm">
						<Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<p className="text-muted-foreground text-xs leading-snug">
							Ci sono 4 aggiornamenti al giorno. Fine aggiornamento di tutte le
							mappe circa alle ore: {updateTimes}.
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
}: {
	title: string;
	description: string;
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
			<Link href="/login" className={buttonVariants()}>
				Accedi
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
