import {
	CircleAlert,
	CircleCheck,
	CloudRain,
	Info,
	Layers,
	OctagonX,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ForecastDetailDialog } from "@/components/meteo/ForecastDetailDialog";
import { ForecastWindCell } from "@/components/meteo/ForecastWindCell";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	cloudLayers,
	type ForecastHourView,
	type ForecastTableView,
	formatCloudBase,
	formatHour,
	formatMaxFlight,
	hasAnyMaxFlight,
	hasAnyPrecipitation,
	hasAnyRisk,
	hasAnyStableLayer,
	hasAnyThermals,
	hasRisk,
	lowestStableLayerM,
	shortWindLabel,
	topThermalM,
	updraftList,
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
 *
 * Several columns read as bare numbers unless you already know the model behind
 * them, so the three that a pilot most often misreads carry a description in
 * their header dialog, and the two that summarise a list open that list on tap.
 * Everything extra is behind a click rather than a hover: on a phone, which is
 * where these tables are actually read, a `title` tooltip never appears at all.
 */
export function ForecastTable({ table }: { table: ForecastTableView }) {
	const t = useTranslations("MeteoPage.ForecastTable");
	const showThermals = hasAnyThermals(table.hours);
	const showMaxFlight = hasAnyMaxFlight(table.hours);
	const showStableLayer = hasAnyStableLayer(table.hours);
	const showPrecipitation = hasAnyPrecipitation(table.hours);
	const showRisk = hasAnyRisk(table.hours);

	return (
		// The table is what scrolls, in both directions, and that is deliberate: a
		// header row can only pin to the box that scrolls it, and the sideways
		// scrolling a phone needs already makes this box a scroll container. Left
		// to the page, the header would sit still at the top of the table and slide
		// away with it. `flex-auto min-h-0` takes the height the surrounding pane
		// has left over, which is what gives the rows somewhere to scroll.
		//
		// Containment is on the horizontal axis only. Applied to both, reaching the
		// last row trapped the gesture here and the page would not scroll on past
		// the table — the pane is nearly the whole viewport, so there was no
		// comfortable margin left to grab instead. Vertically the scroll now chains
		// to the page the way an inner box normally does; horizontally it stays
		// contained, because there a chained scroll is the browser's back-swipe.
		<div className="min-h-0 flex-auto overflow-auto overscroll-x-contain rounded-b-xl">
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
						<TableHead className="text-center">
							<ColumnInfo title={t("clouds")} description={t("clouds_hint")}>
								{t("clouds")}
							</ColumnInfo>
						</TableHead>
						{showRisk && (
							<TableHead className="text-center">
								<ColumnInfo title={t("risks")} description={<RiskLegend />}>
									{t("risks")}
								</ColumnInfo>
							</TableHead>
						)}
						<TableHead className="text-center">{t("temperature")}</TableHead>
						{showPrecipitation && (
							<TableHead className="text-center">
								{t("precipitation")}
							</TableHead>
						)}
						{showMaxFlight && (
							<TableHead className="whitespace-nowrap text-center">
								<ColumnInfo
									title={t("max_flight")}
									description={t("max_flight_hint")}
								>
									{t("max_flight")}
								</ColumnInfo>
							</TableHead>
						)}
						<TableHead className="whitespace-nowrap text-center">
							<ColumnInfo
								title={t("cloud_base")}
								description={t("cloud_base_description")}
							>
								{t("cloud_base")}
							</ColumnInfo>
						</TableHead>
						{showThermals && (
							<TableHead className="text-center">
								<ColumnInfo
									title={t("thermals")}
									description={
										<>
											{t("thermals_description")} {t("thermals_maps_hint")}{" "}
											{/* The source tells pilots to check the thermal maps
											    against this column. It links its own; we link the
											    club's copy of the same maps, because following a
											    URL out of the scraped page is exactly what the
											    source's bot trap punishes. */}
											<Link
												href="/meteo/maps"
												className="font-medium underline underline-offset-4"
											>
												{t("thermals_maps_link")}
											</Link>
										</>
									}
								>
									{t("thermals")}
								</ColumnInfo>
							</TableHead>
						)}
						{showStableLayer && (
							<TableHead className="whitespace-nowrap text-center">
								<ColumnInfo
									title={t("stable_layer")}
									description={t("stable_layer_description")}
								>
									{t("stable_layer")}
								</ColumnInfo>
							</TableHead>
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
						const base = formatCloudBase(hour);
						const thermal = topThermalM(hour);
						const maxFlight = formatMaxFlight(hour);

						return (
							<TableRow key={hour.hour}>
								{/* Pinned so the hour stays readable while the wind columns
							    are scrolled into view on a phone. */}
								<TableCell className="sticky left-0 bg-background text-center font-medium tabular-nums">
									{formatHour(hour.hour)}
								</TableCell>

								<TableCell className="text-center">
									<CloudsCell hour={hour} />
								</TableCell>

								{showRisk && (
									<TableCell className="text-center">
										<RiskCell hour={hour} />
									</TableCell>
								)}

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

								{showMaxFlight && (
									<TableCell className="whitespace-nowrap text-center tabular-nums">
										{maxFlight === null ? (
											<Empty />
										) : (
											<span className="font-medium text-sky-700 dark:text-sky-400">
												{maxFlight}
											</span>
										)}
									</TableCell>
								)}

								<TableCell className="whitespace-nowrap text-center tabular-nums">
									{base === null ? (
										<Empty />
									) : base.belowTakeOff ? (
										// The base can sit at or under take-off: the one reading in
										// this column a pilot must not mistake for a ceiling, so it
										// is worded rather than reduced to its upper bound.
										<span
											className="font-medium text-amber-700 dark:text-amber-400"
											title={t("cloud_base_below_take_off")}
										>
											≤ {t("take_off")}
											{base.text ? ` – ${base.text}` : ""}
										</span>
									) : (
										base.text
									)}
								</TableCell>

								{showThermals && (
									<TableCell className="whitespace-nowrap text-center tabular-nums">
										{thermal === null ? (
											<Empty />
										) : (
											<ThermalsCell hour={hour} topM={thermal} />
										)}
									</TableCell>
								)}

								{showStableLayer && (
									<TableCell className="whitespace-nowrap text-center tabular-nums">
										{hour.stableLayers.length === 0 ? (
											<Empty />
										) : (
											<StableLayerCell hour={hour} />
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

/**
 * A column header that explains itself on tap.
 *
 * The descriptions are the source's own wording for what its model publishes —
 * "the base of the medium and low clouds will sit between MIN and MAX" is not
 * something a column of numbers can convey, and guessing at it is how a pilot
 * reads a ceiling as a floor. The icon is what says the header is pressable;
 * the label stays plain so the header still scans as a header.
 */
function ColumnInfo({
	title,
	description,
	children,
}: {
	title: string;
	description: ReactNode;
	children: ReactNode;
}) {
	return (
		<ForecastDetailDialog
			title={title}
			description={description}
			className="mx-auto inline-flex items-center gap-1 no-underline"
			label={
				<>
					{children}
					<Info className="size-3 shrink-0 text-muted-foreground" />
				</>
			}
		/>
	);
}

/**
 * The three cloud decks the source publishes, in its own H-M-L order.
 *
 * Shown as three figures rather than one because they describe three different
 * skies: 100% high cloud is cirrus a pilot flies under, 100% low cloud is a lid
 * on the day, and any single summary number loses which of the two it is. The
 * initials are spelled out underneath at the size the wind cells use theirs, so
 * the row reads without the header.
 *
 * Each figure keeps its per cent sign, as the source prints it: the columns
 * either side are degrees and millimetres, and a bare "52" between them does
 * not say which of the three it is.
 */
function CloudsCell({ hour }: { hour: ForecastHourView }) {
	const t = useTranslations("MeteoPage.ForecastTable");
	const layers = cloudLayers(hour);

	if (layers === null) return <Empty />;

	const labels = {
		high: t("clouds_high"),
		medium: t("clouds_medium"),
		low: t("clouds_low"),
	} as const;

	return (
		<span className="inline-flex gap-1.5 leading-tight">
			{layers.map(({ layer, cover }) => (
				<span key={layer} className="inline-flex flex-col items-center">
					{/* Which deck the figure belongs to, spelled out for a reader who
					    cannot see the initial printed underneath it. */}
					<span className="sr-only">{labels[layer]}</span>
					<span
						className={cn(
							"whitespace-nowrap tabular-nums",
							cover !== null && cover >= 80 && "font-medium",
						)}
					>
						{cover === null ? "—" : `${cover}%`}
					</span>
					<span
						aria-hidden
						className="text-[0.625rem] text-muted-foreground uppercase"
					>
						{labels[layer].charAt(0)}
					</span>
				</span>
			))}
		</span>
	);
}

/**
 * The highest updraft a pilot can climb to, opening the full modelled list.
 *
 * The cell can only carry one figure and it has to be the reachable one — the
 * source models updrafts above the inversion too, and showing those announced a
 * 2310 m day on an hour whose real ceiling was 1071 m. But a pilot comparing
 * this table against the source's own needs to see the rest, with the same two
 * markings it uses: red for out of reach, an asterisk for inside an inversion.
 */
function ThermalsCell({
	hour,
	topM,
}: {
	hour: ForecastHourView;
	topM: number;
}) {
	const t = useTranslations("MeteoPage.ForecastTable");
	const updrafts = updraftList(hour);

	return (
		<ForecastDetailDialog
			title={t("thermals_dialog_title", { hour: formatHour(hour.hour) })}
			description={t("thermals_hint")}
			className="font-medium text-emerald-700 dark:text-emerald-400"
			label={`${topM} m`}
		>
			<ul className="divide-y text-sm">
				{updrafts.map((updraft) => (
					<li
						key={updraft.altitudeM}
						className="flex items-center justify-between gap-4 py-1.5"
					>
						<span
							className={cn(
								"font-medium tabular-nums",
								updraft.reachable
									? "text-emerald-700 dark:text-emerald-400"
									: "text-red-700 dark:text-red-400",
							)}
						>
							{updraft.altitudeM} m{updraft.inInversion && "*"}
						</span>
						{/* Two separate facts about the same altitude — whether a climb
						    gets there, and whether it sits in stagnant air — so they are
						    stacked rather than run together on one line. */}
						<span className="flex flex-col items-end text-right text-muted-foreground text-xs">
							<span>
								{updraft.reachable
									? t("thermals_reachable")
									: t("thermals_unreachable")}
							</span>
							{updraft.inInversion && <span>{t("thermals_in_inversion")}</span>}
						</span>
					</li>
				))}
			</ul>
		</ForecastDetailDialog>
	);
}

/**
 * The base of the lowest inversion, opening every band the hour carries.
 *
 * The lowest base is where a climb is expected to stop, so that is the figure
 * the column shows; an hour can carry two bands and neither fits a phone
 * column, which is what the dialog is for.
 */
function StableLayerCell({ hour }: { hour: ForecastHourView }) {
	const t = useTranslations("MeteoPage.ForecastTable");

	return (
		<ForecastDetailDialog
			title={t("stable_layer_dialog_title", { hour: formatHour(hour.hour) })}
			description={t("stable_layer_hint")}
			className="inline-flex items-center gap-1 text-muted-foreground"
			label={
				<>
					<Layers className="size-3 shrink-0" />
					{lowestStableLayerM(hour)} m
				</>
			}
		>
			<ul className="divide-y text-sm">
				{hour.stableLayers.map((layer) => (
					<li
						key={`${layer.fromM}-${layer.toM}`}
						className="py-1.5 font-medium tabular-nums"
					>
						{/* Passed as text, not as numbers: an ICU number argument picks
						    up the locale's grouping separator, and "1.548 m" next to the
						    ungrouped "1548 m" in the column reads as a different figure. */}
						{t("stable_layer_band", {
							from: String(layer.fromM),
							to: String(layer.toM),
						})}
					</li>
				))}
			</ul>
		</ForecastDetailDialog>
	);
}

/**
 * The hour's risk grading, and the source's note when it printed one.
 *
 * The grading comes from the icon and is published on every row, including the
 * calm ones; the note is extra wording that only some graded hours carry. The
 * column used to key off the note alone, so a day the source marked LOW all
 * through showed no risk column at all.
 *
 * Each level gets its own shape, not just its own colour, because that is what
 * the source does: a tick for LOW, an exclamation mark for MEDIUM, a cross for
 * HIGH. Two levels drawn as the same triangle in two colours tell a
 * colour-blind pilot nothing, and they are two thirds of the vocabulary.
 *
 * The note is kept in the source's own English rather than translated: it is a
 * safety statement, and re-wording one risks changing what it says.
 */
const riskStyles = {
	low: {
		Icon: CircleCheck,
		className: "text-emerald-700 dark:text-emerald-400",
		label: "risk_low",
	},
	medium: {
		Icon: CircleAlert,
		className: "text-amber-700 dark:text-amber-400",
		label: "risk_medium",
	},
	high: {
		Icon: OctagonX,
		className: "font-medium text-red-700 dark:text-red-400",
		label: "risk_high",
	},
} as const;

function RiskCell({ hour }: { hour: ForecastHourView }) {
	const t = useTranslations("MeteoPage.ForecastTable");
	const note = hasRisk(hour) ? hour.risk : null;

	if (hour.riskLevel === null && note === null) return <Empty />;

	// A note without a grading is the source publishing wording we cannot rank;
	// showing it as a level would be inventing one, so it stays plain text.
	if (hour.riskLevel === null) {
		return (
			<span className="text-[0.6875rem] text-muted-foreground leading-tight">
				{note}
			</span>
		);
	}

	const { Icon, className, label } = riskStyles[hour.riskLevel];
	const level = t(label);

	// The level always reaches a screen reader; on screen it is the icon's job,
	// and the width goes to the note when there is one.
	const cell = (
		<>
			<Icon className="size-3.5 shrink-0" />
			<span className="sr-only">{level}</span>
			{note && <span className="hidden sm:inline">{note}</span>}
		</>
	);

	const cellClass = cn(
		"inline-flex items-center gap-1 text-[0.6875rem] leading-tight",
		className,
	);

	if (note === null) {
		return <span className={cellClass}>{cell}</span>;
	}

	// The note only fits from `sm` up, so on a phone the icon would be the whole
	// warning — and the wording is the part that says what to watch out for.
	return (
		<ForecastDetailDialog
			title={t("risk_dialog_title", { hour: formatHour(hour.hour) })}
			description={level}
			className={cn(cellClass, "sm:no-underline")}
			label={cell}
		>
			<p className="font-medium text-sm">{note}</p>
		</ForecastDetailDialog>
	);
}

/**
 * What the three risk icons mean, as the header's dialog.
 *
 * On a phone the cell is the icon and nothing else — the source's note needs
 * width the column does not have — so the shapes carry the whole column there.
 * A legend is what makes them readable the first time.
 */
function RiskLegend() {
	const t = useTranslations("MeteoPage.ForecastTable");

	return (
		<span className="flex flex-col gap-1.5">
			{(["low", "medium", "high"] as const).map((level) => {
				const { Icon, className, label } = riskStyles[level];
				return (
					<span
						key={level}
						className={cn("flex items-center gap-2", className)}
					>
						<Icon className="size-4 shrink-0" />
						{t(label)}
					</span>
				);
			})}
		</span>
	);
}

function Empty() {
	return <span className="text-muted-foreground">—</span>;
}
