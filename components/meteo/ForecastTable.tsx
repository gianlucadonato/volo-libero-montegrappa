import { CloudRain, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { ForecastWindCell } from "@/components/meteo/ForecastWindCell";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type ForecastTableView,
	formatCloudBase,
	formatHour,
	hasAnyPrecipitation,
	hasAnyThermals,
	hasRisk,
	shortWindLabel,
	topThermalM,
	totalCloudCover,
} from "@/lib/elmeteo-forecast-view";
import { cn } from "@/lib/utils";

/**
 * One take-off's hourly forecast for one day.
 *
 * The column set follows the table it is given rather than being fixed: the
 * take-offs publish different wind altitudes (Panettone 3, Borso 5), and the
 * thermals and rain columns are dropped on a day that has neither, which is
 * most of winter. A column of dashes costs width the phone layout cannot spare.
 *
 * Wide on purpose: the table scrolls inside its own box rather than wrapping
 * cells, because a wrapped forecast row is unreadable at a glance. That box is
 * written out here instead of using the shared `Table` wrapper, which only
 * scrolls sideways — see the comment on it below.
 */
export function ForecastTable({ table }: { table: ForecastTableView }) {
	const t = useTranslations("MeteoPage.ForecastTable");
	const showThermals = hasAnyThermals(table.hours);
	const showPrecipitation = hasAnyPrecipitation(table.hours);
	const showRisk = table.hours.some(hasRisk);

	return (
		// The table is what scrolls, in both directions, and that is deliberate: a
		// header row can only pin to the box that scrolls it, and the sideways
		// scrolling a phone needs already makes this box a scroll container. Left
		// to the page, the header would sit still at the top of the table and slide
		// away with it. `flex-auto min-h-0` takes the height the surrounding pane
		// has left over, which is what gives the rows somewhere to scroll.
		<div className="min-h-0 flex-auto overflow-auto overscroll-contain rounded-b-xl">
			<table className="w-full caption-bottom text-xs sm:text-sm">
				{/* Pinned per cell rather than on the `thead`: sticky on a table
				    section is only recently supported in Safari, while a sticky `th`
				    has worked for years. Above the rows, with the hour column above
				    the rest in turn, so the two pinned edges cross cleanly at the
				    corner. The separator is an inset shadow rather than the row's
				    border: borders collapse into the table's own grid, which stays
				    put while the header travels. */}
				<TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background [&_th]:shadow-[inset_0_-1px_0_var(--color-border)] [&_tr]:border-0">
					<TableRow className="hover:bg-transparent">
						<TableHead className="sticky left-0 z-20! bg-background text-center">
							{t("hour")}
						</TableHead>
						<TableHead className="text-center">{t("clouds")}</TableHead>
						<TableHead className="text-center">{t("temperature")}</TableHead>
						{showPrecipitation && (
							<TableHead className="text-center">
								{t("precipitation")}
							</TableHead>
						)}
						<TableHead className="whitespace-nowrap text-center">
							{t("cloud_base")}
						</TableHead>
						{showThermals && (
							<TableHead className="text-center">{t("thermals")}</TableHead>
						)}
						{showRisk && (
							<TableHead className="text-center">{t("risks")}</TableHead>
						)}
						{table.windLabels.map((label) => (
							<TableHead key={label} className="text-center" title={label}>
								<span className="block font-normal text-[0.625rem] text-muted-foreground">
									{t("wind")}
								</span>
								{shortWindLabel(label)}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>

				<TableBody>
					{table.hours.map((hour) => {
						const cover = totalCloudCover(hour);
						const base = formatCloudBase(hour);
						const thermal = topThermalM(hour);

						return (
							<TableRow key={hour.hour}>
								{/* Pinned so the hour stays readable while the wind columns
							    are scrolled into view on a phone. */}
								<TableCell className="sticky left-0 bg-background text-center font-medium tabular-nums">
									{formatHour(hour.hour)}
								</TableCell>

								<TableCell className="text-center tabular-nums">
									{cover === null ? (
										<Empty />
									) : (
										<span
											className={cn(
												cover >= 80 && "font-medium text-muted-foreground",
											)}
										>
											{cover}%
										</span>
									)}
								</TableCell>

								<TableCell className="text-center tabular-nums">
									{hour.temperatureC === null ? (
										<Empty />
									) : (
										`${hour.temperatureC}°`
									)}
								</TableCell>

								{showPrecipitation && (
									<TableCell className="text-center tabular-nums">
										{hour.precipitationMm ? (
											<span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
												<CloudRain className="size-3" />
												{hour.precipitationMm}
											</span>
										) : (
											<Empty />
										)}
									</TableCell>
								)}

								<TableCell className="whitespace-nowrap text-center tabular-nums">
									{base ?? <Empty />}
								</TableCell>

								{showThermals && (
									<TableCell className="whitespace-nowrap text-center tabular-nums">
										{thermal === null ? (
											<Empty />
										) : (
											<span
												className="font-medium text-emerald-700 dark:text-emerald-400"
												title={t("thermals_tooltip", {
													altitudes: `${hour.thermalUpdraftsM.join("m, ")}m`,
												})}
											>
												{thermal} m
											</span>
										)}
									</TableCell>
								)}

								{showRisk && (
									<TableCell className="text-center">
										{hasRisk(hour) ? (
											// The source's own wording, in English, kept verbatim:
											// re-translating a safety note risks changing it.
											<span
												className="inline-flex items-center gap-1 text-[0.6875rem] text-amber-700 leading-tight dark:text-amber-400"
												title={hour.risk ?? undefined}
											>
												<TriangleAlert className="size-3 shrink-0" />
												<span className="hidden sm:inline">{hour.risk}</span>
											</span>
										) : (
											<Empty />
										)}
									</TableCell>
								)}

								{table.windLabels.map((label) => (
									<TableCell key={label} className="text-center">
										<ForecastWindCell
											wind={hour.winds.find((wind) => wind.label === label)}
										/>
									</TableCell>
								))}
							</TableRow>
						);
					})}
				</TableBody>
			</table>
		</div>
	);
}

function Empty() {
	return <span className="text-muted-foreground">—</span>;
}
