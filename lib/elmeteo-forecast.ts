import * as cheerio from "cheerio";

/**
 * Parser for the hourly forecast table of an elmeteo.it take-off page.
 *
 * ## Columns are resolved by header name, not by position
 *
 * The set of columns differs per site: Panettone publishes 12 (one free-atmos
 * wind at 1500m and 2000m), Borso 14 (it adds 500m and 1000m). Hardcoding
 * indices would therefore read the wrong column on some sites — and because
 * every value is a plausible altitude or wind, the result would look correct
 * while being wrong.
 *
 * Each column is instead located by matching its header, and the wind columns
 * are whatever headers match /wind/i, kept in source order with their labels.
 *
 * ## `<br>` must be treated as a separator
 *
 * The source lays every cell out across `<br>` lines. Cheerio's `.text()`
 * concatenates them with nothing in between, which welds tokens together
 * ("Wind 1500mfree atmos.") and can merge two numbers into one — so all text
 * goes through `text()` below, never `.text()` directly.
 *
 * `parseForecastTable` is pure so it can be unit-tested against saved fixtures;
 * fetching lives in lib/elmeteo-scraper.ts.
 */

/** A wind reading: direction, mean speed and, when published, the gust. */
export type ElmeteoWind = {
	/** Header label the column was published under, e.g. "Wind 10m". */
	label: string;
	/** Compass direction as printed, e.g. "WNW". Absent when calm. */
	direction?: string;
	/** Mean speed in km/h. */
	speedKmh?: number;
	/** Gust in km/h, from the "MAX: n km/h" line some pages add. */
	gustKmh?: number;
};

export type ElmeteoForecastHour = {
	/** Hour the row is valid until, 0-23, from the "until HH:00" cell. */
	hour: number;
	/** Cloud cover percentages, high-medium-low, as published. */
	cloudsHigh?: number;
	cloudsMedium?: number;
	cloudsLow?: number;
	/** Risk note, e.g. "thunderstorm not ruled out". Empty when low risk. */
	risk?: string;
	temperatureC?: number;
	precipitationMm?: number;
	/** Verbatim flight-altitude text, e.g. "BETWEEN 991m AND 1280m". */
	maxFlightAltitude?: string;
	cloudBaseMinM?: number;
	cloudBaseMaxM?: number;
	/** Updraft ceilings in metres, highest first. Empty when no thermals. */
	thermalUpdraftsM: number[];
	stableLayerM?: number;
	winds: ElmeteoWind[];
};

export type ElmeteoForecastTable = {
	/** Take-off altitude printed in the page title, in metres. */
	altitudeM?: number;
	/** "Maximum Daily Cloud Base Altitude" of the selected day, in metres. */
	maxDailyCloudBaseM?: number;
	/** When the source last refreshed the model, if the page prints it. */
	updatedAt?: Date;
	hours: ElmeteoForecastHour[];
};

/**
 * How each non-wind column is recognised from its header text. The first
 * pattern that matches wins, so the more specific ones come first.
 */
const columnPatterns = {
	time: /^time/i,
	icon: /icon/i,
	risk: /risk/i,
	temperature: /temp/i,
	precipitation: /prec/i,
	maxFlightAltitude: /max flight/i,
	cloudBase: /cloud base/i,
	thermalUpdraft: /thermal updraft/i,
	stableLayer: /stable layer/i,
} as const;

type ColumnName = keyof typeof columnPatterns;

/** Locates each known column, plus the wind columns, from the header row. */
function mapColumns(headers: string[]) {
	const indices = {} as Record<ColumnName, number | undefined>;

	for (const [name, pattern] of Object.entries(columnPatterns) as [
		ColumnName,
		RegExp,
	][]) {
		const index = headers.findIndex(
			(header) => pattern.test(header) && !/wind/i.test(header),
		);
		indices[name] = index === -1 ? undefined : index;
	}

	const winds = headers
		.map((header, index) => ({ label: header, index }))
		.filter(({ label }) => /wind/i.test(label));

	return { indices, winds };
}

/**
 * Text of a cell, with `<br>` treated as a separator.
 *
 * The source lays every cell out across `<br>` lines ("WNW<br>6<br> km/h"), and
 * cheerio's `.text()` concatenates them with nothing in between, which welds
 * tokens together ("Wind 1500mfree atmos.") and can merge two numbers into one.
 */
/**
 * Text of a node, with line breaks treated as separators.
 *
 * The source splits cell content across both `<br>` and block elements
 * (`<p>`, `<div>`), and cheerio's `.text()` concatenates all of them with
 * nothing in between: "MIN same altitude or lower" + "MAX 1700m" comes out as
 * "...lowerMAX 1700m", which hides the boundary from every regex below.
 */
function text(node: cheerio.Cheerio<never>) {
	const clone = node.clone();
	clone.find("br, p, div, tr").after(" ");
	return clone.text().replace(/\s+/g, " ").trim();
}

/** First number in a string, tolerating decimals and a leading sign. */
function toNumber(value: string | undefined) {
	if (!value) return undefined;
	const match = /-?\d+(?:[.,]\d+)?/.exec(value);
	return match ? Number(match[0].replace(",", ".")) : undefined;
}

/** "until 07:00" -> 7. Returns undefined for the header or a spacer row. */
function parseHour(value: string) {
	const match = /(\d{1,2}):\d{2}/.exec(value);
	if (!match) return undefined;
	const hour = Number(match[1]);
	return hour >= 0 && hour <= 24 ? hour : undefined;
}

/** "Clouds % H-M-L 100-0-28" -> [100, 0, 28]. */
function parseClouds(value: string) {
	const match = /(\d{1,3})\s*-\s*(\d{1,3})\s*-\s*(\d{1,3})/.exec(value);
	if (!match) return {};
	return {
		cloudsHigh: Number(match[1]),
		cloudsMedium: Number(match[2]),
		cloudsLow: Number(match[3]),
	};
}

/** "MIN 950m ... MAX 1250m" -> the two bounds, either of which may be absent. */
function parseCloudBase(value: string) {
	const min = /MIN\s*(\d+)\s*m/i.exec(value);
	const max = /MAX\s*(\d+)\s*m/i.exec(value);
	return {
		cloudBaseMinM: min ? Number(min[1]) : undefined,
		cloudBaseMaxM: max ? Number(max[1]) : undefined,
	};
}

/**
 * "AT 2297m, AT 2032m, ..." -> [2297, 2032, ...].
 * "No Thermal Activity" yields an empty list.
 */
function parseUpdrafts(value: string) {
	return Array.from(value.matchAll(/AT\s*(\d+)\s*m/gi), (match) =>
		Number(match[1]),
	);
}

/**
 * Reads one wind cell. The direction and speed sit on separate lines, and some
 * pages add a "MAX: n km/h" gust line; the cell is blank when calm.
 */
function parseWind(label: string, value: string): ElmeteoWind {
	const gust = /MAX:?\s*(\d+(?:[.,]\d+)?)/i.exec(value);
	// Strip the gust before reading the mean speed, so "MAX: 5" is not mistaken
	// for it on the pages that print the gust inside the same cell.
	const mean = gust ? value.replace(gust[0], " ") : value;
	const direction = /\b([NSEW]{1,3})\b/.exec(mean);

	return {
		label,
		direction: direction?.[1],
		speedKmh: toNumber(mean),
		gustKmh: gust ? Number(gust[1].replace(",", ".")) : undefined,
	};
}

export function parseForecastTable(html: string): ElmeteoForecastTable {
	const $ = cheerio.load(html);
	const table = $("table").first();

	if (table.length === 0) {
		throw new Error("No forecast table found: the page may be a login wall");
	}

	const headers = table
		.find("tr")
		.first()
		.find("th")
		.map((_, element) => text($(element) as cheerio.Cheerio<never>))
		.toArray();

	const { indices, winds: windColumns } = mapColumns(headers);

	const hours: ElmeteoForecastHour[] = [];

	for (const row of table.find("tr").toArray()) {
		const cells = $(row)
			.find("td")
			.map((_, element) => text($(element) as cheerio.Cheerio<never>))
			.toArray();

		if (cells.length === 0) continue;

		/** Cell under a named column, or "" when the site omits that column. */
		const cell = (name: ColumnName) => {
			const index = indices[name];
			return index === undefined ? "" : (cells[index] ?? "");
		};

		const hour = parseHour(cell("time"));
		// Skips the header and any spacer/footer row without an "until HH:00".
		if (hour === undefined) continue;

		hours.push({
			hour,
			...parseClouds(cell("icon")),
			risk: cell("risk") || undefined,
			temperatureC: toNumber(cell("temperature")),
			precipitationMm: toNumber(cell("precipitation")),
			maxFlightAltitude: cell("maxFlightAltitude") || undefined,
			...parseCloudBase(cell("cloudBase")),
			thermalUpdraftsM: parseUpdrafts(cell("thermalUpdraft")),
			stableLayerM: toNumber(cell("stableLayer")),
			winds: windColumns.map(({ label, index }) =>
				parseWind(label, cells[index] ?? ""),
			),
		});
	}

	if (hours.length === 0) {
		throw new Error("Forecast table has no hourly rows");
	}

	const body = text($("body") as cheerio.Cheerio<never>);

	return {
		// Anchored on the unit, not on a "Take Off" prefix: the landing page
		// titles itself "Landing Garden Relais 170 mslm" with no such prefix, so
		// requiring it silently dropped the altitude on that site. Every page
		// prints "mslm" exactly once, immediately after the figure.
		altitudeM: toNumber(/(\d+)\s*mslm/i.exec(body)?.[1]),
		maxDailyCloudBaseM: parseMaxDailyCloudBase($, body),
		updatedAt: parseUpdatedAt(body),
		hours,
	};
}

/**
 * "Maximum Daily Cloud Base Altitude" of the day being shown, in metres.
 *
 * The figure is printed in the day-tab strip, which carries all three days at
 * once ("Thu 1450 +- 100m / Fri 1500 / Sat 1475"). Taking the first match in
 * the page therefore reported *today's* ceiling on every day's table — a wrong
 * number that still looks like a plausible one. The tab of the rendered day
 * carries `active` in its class, so that is what we read.
 *
 * The anchors are only ever read, never followed: elmeteo.it's blackhole trap
 * bans the IP of anything that crawls links out of its HTML.
 */
function parseMaxDailyCloudBase($: cheerio.CheerioAPI, body: string) {
	const active = $('a[href*="day="]')
		.filter((_, element) => /\bactive\b/.test($(element).attr("class") ?? ""))
		.first();

	if (active.length > 0) {
		const value = toNumber(
			/Cloud Base Altitude\s*(\d+(?:[.,]\d+)?)/i.exec(
				text(active as cheerio.Cheerio<never>),
			)?.[1],
		);
		if (value !== undefined) return value;
	}

	// No active tab (a layout change, or a page without the strip): fall back to
	// the first figure in the page rather than reporting nothing.
	return toNumber(/Cloud Base Altitude\s*(\d+(?:[.,]\d+)?)/i.exec(body)?.[1]);
}

/** "L'ultimo aggiornamento è avvenuto il: September 16 2026 22:15:07." */
function parseUpdatedAt(body: string) {
	const match = /aggiornamento[^:]*:\s*([A-Za-z]+ \d{1,2} \d{4} [\d:]+)/i.exec(
		body,
	);
	if (!match) return undefined;
	const parsed = new Date(`${match[1]} UTC`);
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
