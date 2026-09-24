import * as cheerio from "cheerio";
import { romeOffsetMs } from "@/lib/meteo-time";

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

/**
 * How serious the source considers the hour, read from the icon it prints.
 *
 * The icon carries the level on its own; the text beside it is a note that is
 * only printed for some of the medium and high hours, and is empty on every
 * low one. Reading the text alone therefore lost the whole column on a calm
 * day — see `parseRisk`.
 */
export type ElmeteoRiskLevel = "low" | "medium" | "high";

/** One inversion band: stable air between two altitudes. */
export type ElmeteoStableLayer = { fromM: number; toM: number };

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
	/**
	 * The source's own weather glyph for the hour, as the bare filename it
	 * publishes it under: `sereno`, `parznuv`, `nebbia`. Stored verbatim rather
	 * than mapped to one of ours, so an unseen name survives the scrape and can
	 * be mapped later instead of being lost at parse time.
	 */
	weatherIcon?: string;
	/** Risk level from the icon. Published on every row of every site. */
	riskLevel?: ElmeteoRiskLevel;
	/** Risk note, e.g. "thunderstorm not ruled out". Empty when low risk. */
	risk?: string;
	temperatureC?: number;
	precipitationMm?: number;
	/** Verbatim flight-altitude text, e.g. "BETWEEN 991m AND 1280m". */
	maxFlightAltitude?: string;
	/** The same band as numbers: how high a pilot can climb from take-off. */
	maxFlightMinM?: number;
	maxFlightMaxM?: number;
	cloudBaseMinM?: number;
	cloudBaseMaxM?: number;
	/**
	 * The source printed "MIN same altitude or lower": the base can sit at or
	 * under take-off, so there is no lower bound to publish. Distinct from a
	 * missing `cloudBaseMinM`, which means the source published nothing at all.
	 */
	cloudBaseBelowTakeOff?: boolean;
	/** Every updraft ceiling in metres, highest first, reachable or not. */
	thermalUpdraftsM: number[];
	/** The subset a pilot can actually climb to — see `parseUpdrafts`. */
	reachableUpdraftsM: number[];
	/** Inversion bands, in source order. Empty when the source printed none. */
	stableLayers: ElmeteoStableLayer[];
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

/**
 * The source's weather glyph, from the icon's filename.
 *
 * The third column whose meaning lives in the markup rather than the text,
 * after the risk icon and the updraft colours — and the most thoroughly hidden
 * of the three: the `<img>` carries no `alt` and no `title`, so the filename is
 * the only place the reading exists.
 *
 * It cannot be derived from the percentages published beside it. Across the
 * saved fixtures the low-cloud figure runs 0-45% under `poconuv`, 8-79% under
 * `parznuv` and 0-94% under `coperto`, and at 0% the source prints `sereno`,
 * `poconuv` and `coperto` on different rows. The glyph comes from the source's
 * own model state, which it does not publish.
 *
 * Returns the bare name with no vocabulary check. Seven names are known
 * (`sereno`, `poconuv`, `parznuv`, `coperto`, `copiog`, `tempor`, `nebbia`) but
 * that list is one week of late-summer weather, and `nebbia` turned up exactly
 * once in 252 rows — so it is certainly incomplete. Winter should add snow, and
 * the mapping in `lib/elmeteo-forecast-view.ts` is where an unknown name is
 * handled, so a new one is stored and rendered as a gap rather than rejected
 * here.
 */
function parseWeatherIcon(cell: cheerio.Cheerio<never>) {
	const source = cell.find("img").attr("src") ?? "";
	// The path segment is `day` on every row seen: the tables run 07:00-19:00,
	// so a `night` variant may exist at the source but never reaches us. Only
	// the basename is kept, so it would map the same either way.
	const name = /\/([a-z]+)\.gif(?:[?#]|$)/i.exec(source)?.[1];
	return { weatherIcon: name?.toLowerCase() };
}

/**
 * "MIN 950m ... MAX 1250m" -> the two bounds, either of which may be absent.
 *
 * On a low day the source prints "MIN same altitude or lower" in place of a
 * figure: the cloud base can sit at or below take-off, so there is no lower
 * bound to give. That is the most flight-critical reading the cell has, and
 * reading only the numbers turned it into a bare "1075 m" — indistinguishable
 * from a comfortable ceiling.
 */
function parseCloudBase(value: string) {
	const min = /MIN\s*(\d+)\s*m/i.exec(value);
	const max = /MAX\s*(\d+)\s*m/i.exec(value);
	return {
		cloudBaseMinM: min ? Number(min[1]) : undefined,
		cloudBaseMaxM: max ? Number(max[1]) : undefined,
		cloudBaseBelowTakeOff: /MIN\s*same altitude or lower/i.test(value)
			? true
			: undefined,
	};
}

/**
 * Risk level, from the icon rather than from the text beside it.
 *
 * The source grades every hour with `1en.png` / `2en.png` / `3en.png`, and adds
 * a note only on some of the graded ones — "thunderstorm not ruled out",
 * "possible moderate wind on free atmosphere". Every low hour's note is empty,
 * so reading the text alone reported "no risk data" for a whole calm day and
 * the column was dropped, while the source showed a green LOW on every row.
 */
const riskLevels: Record<string, ElmeteoRiskLevel> = {
	"1": "low",
	"2": "medium",
	"3": "high",
};

function parseRisk(cell: cheerio.Cheerio<never>) {
	const source = cell.find("img").attr("src") ?? "";
	const icon = /([123])en\.png/i.exec(source)?.[1];

	return {
		riskLevel: icon === undefined ? undefined : riskLevels[icon],
		risk: text(cell) || undefined,
	};
}

/**
 * Updraft ceilings, split by whether a pilot can actually get to them.
 *
 * The source colours each line: green for an updraft that can be reached from
 * take-off, red for one sitting above the inversion, which a glider cannot
 * climb through even though the air above it is rising. Reading only the
 * numbers made the two indistinguishable, and the table then showed the
 * highest of all of them — typically 2300m on a day whose real ceiling was
 * 1070m. Verified across all three fixtures plus a live page: the lowest red
 * equals the "Max Flight Altitude" upper bound and every green sits below it,
 * on all 17 rows that publish both.
 *
 * "No Thermal Activity" yields two empty lists.
 */
function parseUpdrafts($: cheerio.CheerioAPI, cell: cheerio.Cheerio<never>) {
	const thermalUpdraftsM: number[] = [];
	const reachableUpdraftsM: number[] = [];

	cell.find("small").each((_, element) => {
		const line = $(element);
		const metres = /AT\s*(\d+)\s*m/i.exec(line.text());
		if (!metres) return;

		thermalUpdraftsM.push(Number(metres[1]));
		if (/color:\s*green/i.test(line.attr("style") ?? "")) {
			reachableUpdraftsM.push(Number(metres[1]));
		}
	});

	// A layout without the per-line colouring still yields the altitudes, so the
	// thermals column keeps working; nothing is claimed to be reachable.
	if (thermalUpdraftsM.length === 0) {
		thermalUpdraftsM.push(
			...Array.from(text(cell).matchAll(/AT\s*(\d+)\s*m/gi), (match) =>
				Number(match[1]),
			),
		);
	}

	return { thermalUpdraftsM, reachableUpdraftsM };
}

/**
 * "*BETWEEN 1548m AND 1795m, *BETWEEN 2049m AND 2312m," -> both bands.
 *
 * The cell holds one or two inversion bands, and the old parser kept only the
 * first number of the first one — so 1548 stood in for a layer running to
 * 2312m, and the second band vanished entirely. The asterisk marks the bands
 * that block the updrafts above them and carries no extra information here.
 */
function parseStableLayers(value: string): ElmeteoStableLayer[] {
	return Array.from(
		value.matchAll(/BETWEEN\s*(\d+)\s*m\s*AND\s*(\d+)\s*m/gi),
		(match) => ({ fromM: Number(match[1]), toM: Number(match[2]) }),
	);
}

/** "BETWEEN 991m AND 1280m" -> the two bounds. */
function parseMaxFlight(value: string) {
	const match = /BETWEEN\s*(\d+)\s*m\s*AND\s*(\d+)\s*m/i.exec(value);
	return {
		maxFlightMinM: match ? Number(match[1]) : undefined,
		maxFlightMaxM: match ? Number(match[2]) : undefined,
	};
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
		const elements = $(row).find("td").toArray();
		if (elements.length === 0) continue;

		const cells = elements.map((element) =>
			text($(element) as cheerio.Cheerio<never>),
		);

		/** Cell under a named column, or "" when the site omits that column. */
		const cell = (name: ColumnName) => {
			const index = indices[name];
			return index === undefined ? "" : (cells[index] ?? "");
		};

		/**
		 * The cell itself, for the two columns whose meaning is in the markup
		 * rather than the text: the risk icon and the updraft colours.
		 */
		const node = (name: ColumnName) => {
			const index = indices[name];
			const element = index === undefined ? undefined : elements[index];
			return (
				element === undefined ? $() : $(element)
			) as cheerio.Cheerio<never>;
		};

		const hour = parseHour(cell("time"));
		// Skips the header and any spacer/footer row without an "until HH:00".
		if (hour === undefined) continue;

		const maxFlightAltitude = cell("maxFlightAltitude");

		hours.push({
			hour,
			...parseClouds(cell("icon")),
			...parseWeatherIcon(node("icon")),
			...parseRisk(node("risk")),
			temperatureC: toNumber(cell("temperature")),
			precipitationMm: toNumber(cell("precipitation")),
			maxFlightAltitude: maxFlightAltitude || undefined,
			...parseMaxFlight(maxFlightAltitude),
			...parseCloudBase(cell("cloudBase")),
			...parseUpdrafts($, node("thermalUpdraft")),
			stableLayers: parseStableLayers(cell("stableLayer")),
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

/**
 * "L'ultimo aggiornamento è avvenuto il: September 16 2026 22:15:07."
 *
 * The stamp carries no zone, and reading it as UTC put it two hours in the
 * future all summer: a page fetched at 11:47 Rome announced it had been
 * refreshed at 12:15. It is the source's own wall clock — an Italian site
 * writing an Italian sentence — so it is read in Europe/Rome and stored as the
 * UTC instant that names.
 */
function parseUpdatedAt(body: string) {
	const match = /aggiornamento[^:]*:\s*([A-Za-z]+ \d{1,2} \d{4} [\d:]+)/i.exec(
		body,
	);
	if (!match) return undefined;
	const parsed = new Date(`${match[1]} UTC`);
	if (Number.isNaN(parsed.getTime())) return undefined;
	return new Date(parsed.getTime() - romeOffsetMs(parsed));
}
