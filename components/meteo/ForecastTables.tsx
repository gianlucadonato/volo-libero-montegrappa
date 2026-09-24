"use client";

import { format } from "date-fns";
import { enUS, it as itLocale } from "date-fns/locale";
import { Mountain } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { ElmeteoForecasts } from "@/actions/getElmeteoForecasts";
import { ForecastTable } from "@/components/meteo/ForecastTable";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ForecastTablesProps = {
	forecasts: ElmeteoForecasts;
};

/** Translation keys for the tabs, by position in the three days collected. */
const dayLabelKeys = ["today", "tomorrow", "after_tomorrow"] as const;

/**
 * The 18 tables, as one on screen at a time.
 *
 * Take-off and day are picked separately, mirroring how elmeteo.it itself
 * presents them (a page per take-off, `?day=` tabs across the top) so pilots
 * read the same interaction they already know.
 *
 * All three days of the chosen take-off are held in state rather than fetched
 * per tab: the whole payload is ~45 kB and it is already on the page, so
 * switching a tab should not cost a round trip.
 *
 * Fills the pane the route gives it rather than growing with the table: the
 * take-off, the day and the column headings all have to stay in view while the
 * hours are scrolled, and a table header can only pin to the box that scrolls
 * it. So the rows scroll inside the card and everything around them holds
 * still.
 */
export function ForecastTables({ forecasts }: ForecastTablesProps) {
	const t = useTranslations("MeteoPage.Tables");
	// The day tabs carry a weekday, so the date formatting follows the UI
	// language rather than being pinned to Italian.
	const tDays = useTranslations("MeteoPage");
	const locale = useLocale();
	const dateLocale = locale === "en" ? enUS : itLocale;

	// Defaults to the first take-off that actually has data, so a failed scrape
	// on Tappeti does not open the page on an empty table.
	//
	// Typed as a plain string rather than as the catalogue's slug union: the
	// value comes back from the Select, which reports a string, and narrowing it
	// here would claim a guarantee the DOM does not give.
	const [siteSlug, setSiteSlug] = useState<string>(
		() =>
			forecasts.sites.find((entry) => entry.days.length > 0)?.site.slug ??
			forecasts.sites[0]?.site.slug,
	);
	const [day, setDay] = useState(forecasts.days[0]);

	const selected = forecasts.sites.find(
		(entry) => entry.site.slug === siteSlug,
	);
	const table = selected?.days.find((entry) => entry.day === day);

	return (
		// Takes the height the page gives it — see the pane comment on the route —
		// and passes what is left down to the table, which is the only part that
		// scrolls.
		<div className="flex min-h-0 flex-auto flex-col gap-4">
			<div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<Select value={siteSlug} onValueChange={setSiteSlug}>
					<SelectTrigger className="w-full sm:w-64">
						<Mountain className="size-4 text-muted-foreground" />
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{forecasts.sites.map(({ site, days }) => (
							<SelectItem
								key={site.slug}
								value={site.slug}
								// A take-off whose scrape failed stays listed but unpickable,
								// so its absence reads as a gap rather than as a site the club
								// no longer covers.
								disabled={days.length === 0}
							>
								{site.name}
								{days.length === 0 && t("site_unavailable")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* A grid rather than a flex row, because the three tabs have to be
				    equal AND wide enough for their own text. Equal flex children
				    (`flex-1 basis-0`) get the first but not the second: a zero basis
				    leaves the group no intrinsic width to claim, so it shrank to where
				    "ven 25" broke across two lines. Grid sizes `1fr` columns from the
				    widest column's content, so the group asks for three times the
				    longest tab and every label sits on one line. */}
				<div className="grid shrink-0 grid-cols-3 rounded-lg border p-0.5">
					{forecasts.days.map((value, index) => (
						<Button
							key={value}
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setDay(value)}
							aria-pressed={value === day}
							className={cn(
								// `h-auto` because the content is two stacked lines and the
								// `sm` size's fixed height would clip them.
								"h-auto w-full px-3 py-1.5 text-xs sm:text-sm",
								value === day && "bg-secondary text-secondary-foreground",
							)}
						>
							<span className="flex flex-col items-center leading-tight">
								{/* The date leads: it is what a pilot is actually picking, and it
								    stays true past the three days "oggi/domani" can name. */}
								<span className="whitespace-nowrap tabular-nums">
									{format(new Date(`${value}T12:00:00Z`), "EEE d", {
										locale: dateLocale,
									})}
								</span>
								{index < dayLabelKeys.length && (
									// Both lines are pinned to one line each: either of them
									// wrapping makes its tab taller than its neighbours, and the
									// dates stop sharing a baseline across the three.
									<span className="whitespace-nowrap font-normal text-[0.625rem] text-muted-foreground">
										{tDays(dayLabelKeys[index])}
									</span>
								)}
							</span>
						</Button>
					))}
				</div>
			</div>

			{table ? (
				// `min-h-0` lets this shrink below the table's natural height, which is
				// what hands the overflow to the scroll box inside it.
				<div className="flex min-h-0 flex-auto flex-col rounded-xl border">
					<div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1 border-b px-4 py-3">
						<h2 className="font-semibold">{selected?.site.name}</h2>
						{table.altitudeM !== null && (
							<span className="text-muted-foreground text-xs tabular-nums">
								{t("altitude", { altitude: table.altitudeM })}
							</span>
						)}
						{table.maxDailyCloudBaseM !== null && (
							<span className="text-muted-foreground text-xs tabular-nums">
								{t("max_cloud_base", { altitude: table.maxDailyCloudBaseM })}
							</span>
						)}
					</div>
					<ForecastTable table={table} />
				</div>
			) : (
				<div className="rounded-xl border border-dashed px-6 py-16 text-center">
					<p className="font-medium">{t("no_table_title")}</p>
					<p className="mt-1 text-muted-foreground text-sm">
						{t("no_table_description")}
					</p>
				</div>
			)}
		</div>
	);
}
