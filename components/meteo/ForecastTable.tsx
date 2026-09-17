import { CloudRain, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { ForecastWindCell } from "@/components/meteo/ForecastWindCell";
import {
	Table,
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
 * Wide on purpose: the table scrolls horizontally inside its own container
 * (see `components/ui/table.tsx`) rather than wrapping cells, because a wrapped
 * forecast row is unreadable at a glance.
 */
export function ForecastTable({ table }: { table: ForecastTableView }) {
	const t = useTranslations("MeteoPage.ForecastTable");
	const showThermals = hasAnyThermals(table.hours);
	const showPrecipitation = hasAnyPrecipitation(table.hours);
	const showRisk = table.hours.some(hasRisk);

	return (
		<Table className="text-xs sm:text-sm">
			<TableHeader>
				<TableRow className="hover:bg-transparent">
					<TableHead className="sticky left-0 bg-background text-center">
						{t("hour")}
					</TableHead>
					<TableHead className="text-center">{t("clouds")}</TableHead>
					<TableHead className="text-center">{t("temperature")}</TableHead>
					{showPrecipitation && (
						<TableHead className="text-center">{t("precipitation")}</TableHead>
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
		</Table>
	);
}

function Empty() {
	return <span className="text-muted-foreground">—</span>;
}
