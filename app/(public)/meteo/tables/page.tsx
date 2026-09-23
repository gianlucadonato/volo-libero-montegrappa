import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import getElmeteoForecasts from "@/actions/getElmeteoForecasts";
import { ForecastTables } from "@/components/meteo/ForecastTables";
import { buttonVariants } from "@/components/ui/button";
import { constructMetadata, siteConfig } from "@/config/site";
import { withCallbackUrl } from "@/helpers/authRedirect";
import { getSessionUser } from "@/lib/session";

export const metadata = constructMetadata({
	title: `Tabelle decolli - ${siteConfig.name}`,
	description:
		"Previsioni orarie per i decolli del Montegrappa: base delle nuvole, termiche, vento alle varie quote e rischi, per oggi e i due giorni successivi.",
});

// Reads the scraped forecasts, which are rewritten on every uploader report.
export const dynamic = "force-dynamic";

export default async function MeteoTablesPage() {
	const [user, t, locale] = await Promise.all([
		getSessionUser(),
		getTranslations("MeteoPage.Tables"),
		getLocale(),
	]);

	// The tables are only read for a member: four of the six take-offs are
	// behind elmeteo.it's own login, so serving them to anonymous visitors would
	// republish paywalled data. Fetching after the check also keeps a logged-out
	// hit off the database entirely.
	const forecasts = user ? await getElmeteoForecasts() : null;
	const dateLocale = locale === "en" ? enUS : itLocale;

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
							{t("header_description")}
						</h3>
					</div>
				</div>
			</div>

			{/* The forecasts are a pane rather than a block that grows with the
			    table: a table header can only pin to the box that scrolls it, so the
			    hours scroll inside the card while the take-off, the day and the
			    column headings hold still around them. The pane is `100dvh` less the
			    layout's fixed header (4.5rem) and the room kept below it, on the
			    dynamic viewport unit so a phone's retracting address bar does not
			    crop the last rows. `min-h-0` lets the card inside shrink past the
			    table's natural height, which is what hands the overflow to it. The
			    hero above and the footer below stay on the page's own scroll. */}
			<div className="container mb-16 flex h-[calc(100dvh-9rem)] min-h-96 flex-col">
				<div className="mt-6 flex shrink-0 flex-wrap items-center justify-between gap-3">
					<Link
						href="/meteo"
						className={buttonVariants({ variant: "ghost", size: "sm" })}
					>
						<ArrowLeft className="size-4" />
						{t("back")}
					</Link>

					{forecasts?.scrapedAt && (
						<p className="text-muted-foreground text-xs tabular-nums">
							{t("scraped_at", {
								date: format(
									new Date(forecasts.scrapedAt),
									"dd/MM/yyyy HH:mm",
									{ locale: dateLocale },
								),
							})}
						</p>
					)}
				</div>

				<div className="mt-4 flex min-h-0 flex-auto flex-col">
					{!forecasts ? (
						<LoginGate
							title={t("locked_title")}
							description={t("locked_description")}
							login={t("login")}
						/>
					) : forecasts.sites.every((entry) => entry.days.length === 0) ? (
						<EmptyState
							title={t("empty_title")}
							description={t("empty_description")}
						/>
					) : (
						<ForecastTables forecasts={forecasts} />
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
			{/* Carry the callback so logging in from here comes back to the tables. */}
			<Link
				href={withCallbackUrl("/login", "/meteo/tables")}
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
