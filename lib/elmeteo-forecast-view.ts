/**
 * Presentation rules for the scraped take-off forecasts.
 *
 * Kept apart from `lib/elmeteo-forecast.ts` (which parses the source HTML) and
 * from the components, so the reading rules are unit-testable on their own and
 * the client bundle does not pull in cheerio.
 *
 * Nothing here invents a threshold: the bands below are the ones elmeteo.it
 * itself applies, transcribed from the colours it prints in its own tables.
 */

/** Wind reading as stored in the `winds` JSON column. */
export type ForecastWind = {
	label: string;
	direction?: string;
	speedKmh?: number;
	gustKmh?: number;
};

/** One hourly row, as the client receives it. */
export type ForecastHourView = {
	hour: number;
	cloudsHigh: number | null;
	cloudsMedium: number | null;
	cloudsLow: number | null;
	risk: string | null;
	temperatureC: number | null;
	precipitationMm: number | null;
	maxFlightAltitude: string | null;
	cloudBaseMinM: number | null;
	cloudBaseMaxM: number | null;
	thermalUpdraftsM: number[];
	stableLayerM: number | null;
	winds: ForecastWind[];
};

/** One (site, day) table, with the metadata the header shows. */
export type ForecastTableView = {
	site: string;
	day: string;
	altitudeM: number | null;
	maxDailyCloudBaseM: number | null;
	/** The source's own publish time, ISO. Shown so pilots can judge staleness. */
	sourceUpdatedAt: string | null;
	/** Wind column labels, in source order — the set differs per take-off. */
	windLabels: string[];
	hours: ForecastHourView[];
};

/**
 * Wind speed bands, in km/h.
 *
 * These are elmeteo.it's own: it prints speeds up to 11 km/h unstyled, 12–20 in
 * orange and 21+ in red. Verified across all three saved fixtures — every
 * numeric wind span in them falls in exactly these bands, with no overlap.
 * Re-deriving them from the fixtures is what `tests/lib/elmeteo-forecast-view`
 * does, so a change at the source is caught rather than silently diverging.
 */
export const windBands = { moderate: 12, strong: 21 } as const;

export type WindBand = "calm" | "moderate" | "strong";

export function getWindBand(speedKmh: number | undefined): WindBand {
	if (speedKmh === undefined) return "calm";
	if (speedKmh >= windBands.strong) return "strong";
	if (speedKmh >= windBands.moderate) return "moderate";
	return "calm";
}

/**
 * Shortens a wind column label for a table header.
 *
 * The source publishes "Wind 1500m free atmos.", which is too wide for a column
 * on a phone; the altitude is the part that distinguishes one column from the
 * next. "Wind 10m" has no altitude suffix to extract, so it keeps its own name.
 */
export function shortWindLabel(label: string) {
	const match = /(\d+)\s*m/i.exec(label);
	return match ? `${match[1]}m` : label.replace(/^wind\s*/i, "").trim();
}

/**
 * Total cloud cover, 0–100, as the worst of the three layers.
 *
 * The source publishes high/medium/low separately and draws an icon from them.
 * We have no icon, so the cover shown is the layer that blocks the most sky:
 * summing would exceed 100 and averaging would call a fully overcast low deck
 * "33% cloudy", which is the opposite of what a pilot needs to read.
 */
export function totalCloudCover(hour: ForecastHourView) {
	const layers = [hour.cloudsHigh, hour.cloudsMedium, hour.cloudsLow].filter(
		(value): value is number => value !== null,
	);
	return layers.length === 0 ? null : Math.max(...layers);
}

/**
 * Whether the row carries a risk note the source considered worth printing.
 *
 * The cell is empty on a calm hour, so presence is the signal; the text itself
 * is shown verbatim rather than being re-worded or re-ranked here.
 */
export function hasRisk(hour: ForecastHourView) {
	return hour.risk !== null && hour.risk.trim() !== "";
}

/**
 * Highest updraft ceiling of the hour, or null when there is no thermal
 * activity. The list is stored highest-first, but that is a property of the
 * source's ordering, so the maximum is taken explicitly.
 */
export function topThermalM(hour: ForecastHourView) {
	return hour.thermalUpdraftsM.length === 0
		? null
		: Math.max(...hour.thermalUpdraftsM);
}

/**
 * Whether the day has any thermal activity at all.
 *
 * Used to drop the thermals column on a day that has none, which is most of
 * winter: a column of dashes costs horizontal space that the phone layout does
 * not have.
 */
export function hasAnyThermals(hours: readonly ForecastHourView[]) {
	return hours.some((hour) => hour.thermalUpdraftsM.length > 0);
}

/** Whether any hour of the day expects precipitation. Same reasoning. */
export function hasAnyPrecipitation(hours: readonly ForecastHourView[]) {
	return hours.some(
		(hour) => hour.precipitationMm !== null && hour.precipitationMm > 0,
	);
}

/**
 * The cloud base as one cell: "988 - 1288 m", or a single bound when the source
 * published only one, or null when it published neither.
 */
export function formatCloudBase(hour: ForecastHourView) {
	const { cloudBaseMinM: min, cloudBaseMaxM: max } = hour;
	if (min === null && max === null) return null;
	if (min !== null && max !== null) return `${min} - ${max} m`;
	return `${min ?? max} m`;
}

/** "until 07:00" is stored as 7; the table shows the hour it is valid until. */
export function formatHour(hour: number) {
	return `${String(hour).padStart(2, "0")}:00`;
}
