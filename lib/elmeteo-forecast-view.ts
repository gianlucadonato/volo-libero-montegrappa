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

/** How serious the source graded the hour, from the icon it printed. */
export type ForecastRiskLevel = "low" | "medium" | "high";

/** One inversion band, as stored in the `stableLayers` JSON column. */
export type ForecastStableLayer = { fromM: number; toM: number };

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
	/** The source's own glyph name, verbatim. Null when it published none. */
	weatherIcon: string | null;
	riskLevel: ForecastRiskLevel | null;
	risk: string | null;
	temperatureC: number | null;
	precipitationMm: number | null;
	maxFlightAltitude: string | null;
	maxFlightMinM: number | null;
	maxFlightMaxM: number | null;
	cloudBaseMinM: number | null;
	cloudBaseMaxM: number | null;
	cloudBaseBelowTakeOff: boolean;
	thermalUpdraftsM: number[];
	reachableUpdraftsM: number[];
	stableLayers: ForecastStableLayer[];
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

/** One deck of the sky, in the order the source prints them. */
export type ForecastCloudLayer = {
	layer: "high" | "medium" | "low";
	cover: number | null;
};

/**
 * The three cloud decks as the source publishes them: "H-M-L 100-0-28".
 *
 * All three, not a single summary figure. They are covers of three different
 * skies and a pilot reads them differently — 100% high is cirrus you fly under,
 * 100% low is a lid on the day — so collapsing them to the worst one threw away
 * the distinction, and no arithmetic puts it back. It is also the form pilots
 * already know from the source's own column.
 *
 * Returns null only when the source published no layer at all.
 */
export function cloudLayers(
	hour: ForecastHourView,
): ForecastCloudLayer[] | null {
	const layers: ForecastCloudLayer[] = [
		{ layer: "high", cover: hour.cloudsHigh },
		{ layer: "medium", cover: hour.cloudsMedium },
		{ layer: "low", cover: hour.cloudsLow },
	];
	return layers.every(({ cover }) => cover === null) ? null : layers;
}

/**
 * The source's weather glyph, mapped onto the icon set the site ships.
 *
 * elmeteo.it names its glyphs in Italian and serves them as GIFs from its own
 * host. Neither is something to hotlink: the names are mapped to the
 * Makin-Things set (MIT) so the icons match the rest of the UI and no request
 * ever leaves for the source on a page view.
 *
 * The vocabulary is open. These seven are every name seen across 252 live rows
 * and the saved fixtures, but that is one week of late-summer weather — the
 * seventh, `nebbia`, appeared exactly once, which is the measure of how thin
 * the evidence for "complete" is. Winter will add snow at least. An unmapped
 * name returns null rather than guessing, so the cell falls back to the
 * percentages and the row still reads.
 */
const weatherIcons: Record<string, string> = {
	sereno: "clear-day",
	poconuv: "cloudy-1-day",
	parznuv: "cloudy-3-day",
	// The sunless glyph: `coperto` is a lid on the day, and every day variant in
	// the set keeps a sun showing through.
	coperto: "cloudy",
	copiog: "rainy-2",
	tempor: "severe-thunderstorm",
	nebbia: "fog",
};

/**
 * The icon file to render for the hour, or null when the source published no
 * glyph or one we have not mapped yet.
 */
export function weatherIconName(hour: ForecastHourView) {
	if (hour.weatherIcon === null) return null;
	return weatherIcons[hour.weatherIcon] ?? null;
}

/**
 * Glyphs that draw all the way to the bottom of their canvas.
 *
 * The icons carry no `viewBox` and most of them leave the lower ~29% of the
 * 56x48 canvas empty, which the table closes with a negative margin so the
 * cloud figures sit under the artwork rather than under the blank band. The
 * ones listed here do use that space — `severe-thunderstorm`'s bolt reaches
 * 97% of the height — so the same pull would run the text through them.
 *
 * Measured by rasterising each file and reading its opaque bounds, not by eye.
 */
const fullHeightWeatherIcons = new Set([
	"severe-thunderstorm",
	// Both wind glyphs are the same artwork, drawn lower on the canvas than the
	// cloud ones: 8px of empty below them at a rendered 48, against ~14px.
	"dust",
	"wind",
]);

/** Whether the glyph needs its full canvas height left alone. */
export function weatherIconDrawsFullHeight(icon: string) {
	return fullHeightWeatherIcons.has(icon);
}

/**
 * The glyph for a wind risk note, or null when the note is about something
 * else.
 *
 * The source's wording is open — eight distinct notes so far across the stored
 * rows and the saved fixtures, covering wind, precipitation and thunderstorms,
 * and it phrases the same warning more than one way ("possible moderate wind",
 * "possible moderate wind on free atmosphere"). So this matches on the two
 * words that carry the meaning rather than on the whole string, and anything it
 * does not recognise falls through to the risk grading's own icon.
 *
 * Strength is read from the note, not from `riskLevel`: the levels also grade
 * thunderstorms and rain, so a high hour is not necessarily a windy one.
 */
export function riskWindIcon(hour: ForecastHourView) {
	const note = hour.risk?.toLowerCase();
	if (note === undefined || !/\bwind/.test(note)) return null;
	// Animated blue for strong, still tan for moderate: the movement is the
	// warning, so it is spent on the level a pilot has to act on.
	if (/\bstrong\b/.test(note)) return "wind";
	if (/\bmoderate\b/.test(note)) return "dust";
	return null;
}

/**
 * Whether the row carries a risk note the source considered worth printing.
 *
 * The note is empty on every low hour and on some graded ones, so it is only
 * ever extra wording next to `riskLevel`, never the level itself. The text is
 * shown verbatim rather than re-worded or re-ranked here.
 */
export function hasRisk(hour: ForecastHourView) {
	return hour.risk !== null && hour.risk.trim() !== "";
}

/**
 * The highest updraft a pilot can actually climb to, or null when there is no
 * thermal activity.
 *
 * The source prints every updraft it models, colouring green the ones reachable
 * from take-off and red the ones above the inversion — air that is rising, but
 * that a glider cannot get into. Taking the maximum of all of them announced a
 * 2310m day when the real ceiling was 1071m, which is the kind of number a
 * pilot plans a flight around.
 *
 * Falls back to the full list only when the source published no colours at all,
 * so a layout change downgrades the figure rather than blanking the column.
 */
export function topThermalM(hour: ForecastHourView) {
	const reachable =
		hour.reachableUpdraftsM.length > 0
			? hour.reachableUpdraftsM
			: hour.thermalUpdraftsM;
	return reachable.length === 0 ? null : Math.max(...reachable);
}

/** One modelled updraft, as the details dialog lists it. */
export type ForecastUpdraft = {
	altitudeM: number;
	/** Green at the source: a climb from take-off can get into this one. */
	reachable: boolean;
	/** Starred at the source: the altitude sits inside an inversion band. */
	inInversion: boolean;
};

/**
 * Every updraft the source modelled for the hour, highest first, each carrying
 * the two things its own table says about it with formatting rather than words.
 *
 * `reachable` is the green/red colouring, read at scrape time because the
 * colour is the only place it exists. `inInversion` is the asterisk, and that
 * one is derived here rather than stored: the source stars exactly those
 * altitudes that fall inside one of the hour's own stable-layer bands, which
 * holds on all 180 starred and unstarred lines across the saved fixtures. A
 * derived flag cannot go stale against the bands it is drawn from.
 *
 * The full list, red entries included, is what the cell's dialog shows: the
 * table can only carry the one figure a pilot plans around, but a pilot
 * comparing it against the source's own table needs to see the rest.
 */
export function updraftList(hour: ForecastHourView): ForecastUpdraft[] {
	const reachable = new Set(hour.reachableUpdraftsM);
	return [...hour.thermalUpdraftsM]
		.sort((a, b) => b - a)
		.map((altitudeM) => ({
			altitudeM,
			// With no colours published at all, nothing is known to be out of
			// reach — matching `topThermalM`, which then uses the whole list.
			reachable: reachable.size === 0 || reachable.has(altitudeM),
			inInversion: hour.stableLayers.some(
				(layer) => altitudeM >= layer.fromM && altitudeM <= layer.toM,
			),
		}));
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

/**
 * Whether the source published a precipitation figure for the day at all.
 *
 * Presence, not magnitude: the column used to be dropped unless some hour
 * expected rain, so a dry day showed no rain column and a pilot could not tell
 * "no rain forecast" from "we did not scrape it". The source itself prints
 * "0 mm" on every dry hour for exactly that reason.
 */
export function hasAnyPrecipitation(hours: readonly ForecastHourView[]) {
	return hours.some((hour) => hour.precipitationMm !== null);
}

/** Whether the day has any risk grading to show. */
export function hasAnyRisk(hours: readonly ForecastHourView[]) {
	return hours.some((hour) => hour.riskLevel !== null || hasRisk(hour));
}

/** Whether any hour publishes a max flight altitude. */
export function hasAnyMaxFlight(hours: readonly ForecastHourView[]) {
	return hours.some((hour) => hour.maxFlightMaxM !== null);
}

/** Whether any hour publishes an inversion band. */
export function hasAnyStableLayer(hours: readonly ForecastHourView[]) {
	return hours.some((hour) => hour.stableLayers.length > 0);
}

/**
 * The cloud base as one cell: "988 - 1288 m", or a single bound when the source
 * published only one, or null when it published neither.
 *
 * Returns the bounds rather than a finished string because the low case is not
 * a number at all: the source prints "MIN same altitude or lower", meaning the
 * base can sit at or below take-off. Rendering only the numbers turned that
 * into a bare "1075 m", which reads like a comfortable ceiling and is the
 * opposite of what the hour is telling a pilot.
 */
export function formatCloudBase(hour: ForecastHourView) {
	const { cloudBaseMinM: min, cloudBaseMaxM: max } = hour;
	if (hour.cloudBaseBelowTakeOff) {
		return {
			belowTakeOff: true as const,
			text: max === null ? null : `${max} m`,
		};
	}
	if (min === null && max === null) return null;
	return {
		belowTakeOff: false as const,
		text:
			min !== null && max !== null ? `${min} - ${max} m` : `${min ?? max} m`,
	};
}

/**
 * The max flight altitude as one cell: "794 - 1072 m".
 *
 * How high a pilot can climb from take-off on the strength of the day's
 * thermals — the figure the source leads its own table with, and the one this
 * table was omitting entirely.
 */
export function formatMaxFlight(hour: ForecastHourView) {
	const { maxFlightMinM: min, maxFlightMaxM: max } = hour;
	if (min === null && max === null) return null;
	return min !== null && max !== null ? `${min} - ${max} m` : `${min ?? max} m`;
}

/** The lowest inversion base of the hour: where a climb is expected to stop. */
export function lowestStableLayerM(hour: ForecastHourView) {
	return hour.stableLayers.length === 0
		? null
		: Math.min(...hour.stableLayers.map((layer) => layer.fromM));
}

/** "until 07:00" is stored as 7; the table shows the hour it is valid until. */
export function formatHour(hour: number) {
	return `${String(hour).padStart(2, "0")}:00`;
}
