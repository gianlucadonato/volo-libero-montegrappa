import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseForecastTable } from "@/lib/elmeteo-forecast";

const fixture = (name: string) =>
	readFileSync(join(__dirname, "../fixtures/elmeteo", name), "utf8");

// Saved from https://www.elmeteo.it/panettone.php?day=2026-09-18 (public page,
// 12 columns: free-atmos wind at 1500m and 2000m only).
const panettone = fixture("panettone-public.html");
// Saved from https://www.elmeteo.it/borso.php?day=2026-09-18 (public page,
// 14 columns: it adds Wind 500m and Wind 1000m).
const borso = fixture("borso-public.html");
// Saved from https://www.elmeteo.it/tappeti.php? behind the login (13 columns:
// Wind 1000m but no Wind 500m). The login-only pages are a third column set.
const tappeti = fixture("tappeti-authenticated.html");
// Saved from https://www.elmeteo.it/tappeti.php?day=2026-09-24 behind the login,
// on a thermic day: the only fixture carrying inversion bands, a coloured
// updraft list, a max-flight band and a cloud base that drops to take-off.
const thermals = fixture("tappeti-thermals.html");

describe("parseForecastTable", () => {
	it("reads every hourly row of the table", () => {
		const table = parseForecastTable(panettone);
		expect(table.hours).toHaveLength(13);
		expect(table.hours[0].hour).toBe(7);
		expect(table.hours.at(-1)?.hour).toBe(19);
	});

	it("reads the take-off altitude from the title", () => {
		expect(parseForecastTable(panettone).altitudeM).toBe(1550);
	});

	/**
	 * Borso is a landing, not a take-off, so the source titles it "Landing
	 * Garden Relais 170 mslm" with none of the "Take Off" prefix the other pages
	 * carry. Anchoring the altitude on that prefix dropped it silently here.
	 */
	it("reads the altitude of a site whose title is not a take-off", () => {
		expect(parseForecastTable(borso).altitudeM).toBe(170);
	});

	/**
	 * The day-tab strip prints all three days' ceilings at once, so reading the
	 * first one reported today's figure on tomorrow's table. Both public
	 * fixtures were saved on the 18th, whose tab is the `active` one.
	 */
	it("reads the cloud base of the day being shown, not of the first tab", () => {
		expect(parseForecastTable(panettone).maxDailyCloudBaseM).toBe(1500);
		expect(parseForecastTable(borso).maxDailyCloudBaseM).toBe(1375);
	});

	/** The authenticated fixture was saved on the 17th, the first tab. */
	it("reads the cloud base when the shown day is the first tab", () => {
		expect(parseForecastTable(tappeti).maxDailyCloudBaseM).toBe(1225);
	});

	it("parses temperature and precipitation", () => {
		const [first] = parseForecastTable(panettone).hours;
		expect(first.temperatureC).toBe(8.8);
		expect(first.precipitationMm).toBe(0);
	});

	it("parses the H-M-L cloud triplet", () => {
		const [first] = parseForecastTable(panettone).hours;
		expect(first.cloudsHigh).toBe(100);
		expect(first.cloudsMedium).toBe(0);
		expect(first.cloudsLow).toBe(28);
	});

	/**
	 * The regression this parser exists for: sites publish different column
	 * sets, so a hardcoded index reads the wrong column on some of them.
	 */
	it("labels each wind column from its own header", () => {
		const [first] = parseForecastTable(panettone).hours;
		expect(first.winds).toHaveLength(3);
		expect(first.winds.map((wind) => wind.label)).toEqual([
			"Wind 10m",
			"Wind 1500m free atmos.",
			"Wind 2000m free atmos.",
		]);
		expect(first.winds[0]).toMatchObject({
			direction: "WNW",
			speedKmh: 6,
		});
	});

	it("handles a site publishing more wind columns", () => {
		const [first] = parseForecastTable(borso).hours;
		expect(first.winds.map((wind) => wind.label)).toEqual([
			"Wind 10m",
			"Wind 500m free atmos.",
			"Wind 1000m free atmos.",
			"Wind 1500m free atmos.",
			"Wind 2000m free atmos.",
		]);
	});

	it("collects thermal updraft ceilings, highest first", () => {
		const midday = parseForecastTable(panettone).hours.find(
			(hour) => hour.hour === 12,
		);
		expect(midday?.thermalUpdraftsM.slice(0, 3)).toEqual([2276, 2014, 1759]);
	});

	it("yields no updrafts when the source says there is no thermal activity", () => {
		const evening = parseForecastTable(panettone).hours.find(
			(hour) => hour.hour === 13,
		);
		expect(evening?.thermalUpdraftsM).toEqual([]);
	});

	/**
	 * "MIN same altitude or lower" carries no number, so only the MAX bound is
	 * read: the MIN must stay undefined rather than pick up the 1700. It is not a
	 * missing reading either — the base can sit at or below take-off, which is
	 * the one thing in this column a pilot must not read as a ceiling — so the
	 * wording is kept as a flag of its own.
	 */
	it("parses the cloud base bounds, tolerating a textual MIN", () => {
		const midday = parseForecastTable(panettone).hours.find(
			(hour) => hour.hour === 12,
		);
		expect(midday?.cloudBaseMinM).toBeUndefined();
		expect(midday?.cloudBaseMaxM).toBe(1700);
		expect(midday?.cloudBaseBelowTakeOff).toBe(true);
	});

	it("leaves the flag off for an hour with a numeric MIN", () => {
		const midday = parseForecastTable(borso).hours.find(
			(hour) => hour.hour === 13,
		);
		expect(midday?.cloudBaseMinM).toBe(1163);
		expect(midday?.cloudBaseBelowTakeOff).toBeUndefined();
	});

	it("keeps the flight altitude text verbatim", () => {
		const midday = parseForecastTable(borso).hours.find(
			(hour) => hour.hour === 13,
		);
		expect(midday?.maxFlightAltitude).toBe("BETWEEN 984m AND 1270m");
	});

	/**
	 * Flight altitude and cloud base are adjacent and both full of metres, and
	 * they sit at different indices on different sites, so a positional read
	 * silently swaps them.
	 */
	it("does not confuse cloud base with the flight altitude column", () => {
		const midday = parseForecastTable(borso).hours.find(
			(hour) => hour.hour === 13,
		);
		expect(midday?.maxFlightAltitude).toBe("BETWEEN 984m AND 1270m");
		expect(midday?.cloudBaseMinM).toBe(1163);
		expect(midday?.cloudBaseMaxM).toBe(1463);
	});

	it("reads the gust from the wind cell when the site publishes one", () => {
		const midday = parseForecastTable(borso).hours.find(
			(hour) => hour.hour === 13,
		);
		expect(midday?.winds[0]).toMatchObject({
			label: "Wind 10m",
			direction: "SE",
			speedKmh: 5,
			gustKmh: 9,
		});
	});

	/**
	 * The login-only pages publish a third column set: Wind 1000m like Borso,
	 * but no Wind 500m. Positional indices tuned on the public pages land on the
	 * wrong column here, and every value is a plausible wind or altitude.
	 */
	it("reads the column set of the login-only pages", () => {
		const table = parseForecastTable(tappeti);
		expect(table.hours).toHaveLength(13);
		expect(table.altitudeM).toBe(850);
		expect(table.hours[0].winds.map((wind) => wind.label)).toEqual([
			"Wind 10m",
			"Wind 1000m free atmos.",
			"Wind 1500m free atmos.",
			"Wind 2000m free atmos.",
		]);
	});

	it("parses an authenticated row end to end", () => {
		const midday = parseForecastTable(tappeti).hours.find(
			(hour) => hour.hour === 13,
		);
		expect(midday).toMatchObject({
			temperatureC: 15.3,
			precipitationMm: 0,
			cloudsHigh: 100,
			cloudsMedium: 100,
			cloudsLow: 75,
			cloudBaseMinM: 913,
			cloudBaseMaxM: 1213,
			risk: "possible moderate wind on free atmosphere",
		});
		expect(midday?.winds[0]).toMatchObject({
			label: "Wind 10m",
			direction: "NE",
			speedKmh: 11,
			gustKmh: 23,
		});
	});

	/**
	 * The source turns columns off by wrapping the <th> in an HTML comment
	 * rather than deleting it: Tappeti carries commented-out "Dew Point",
	 * "Wind 10m gust" and "Wind 500m" headers. Counting raw <th> tags sees 17
	 * headers against 13 cells and invents columns that are not rendered.
	 */
	it("ignores the headers the source has commented out", () => {
		expect(tappeti).toContain("<!-- <th>Dew<br><small>Point</small></th> -->");
		const [first] = parseForecastTable(tappeti).hours;
		// Dew Point sits between Temp and Prec in the commented markup: were it
		// counted, precipitation would read the temperature's neighbour instead.
		expect(first.temperatureC).toBe(15.3);
		expect(first.precipitationMm).toBe(0);
		expect(first.winds).toHaveLength(4);
	});

	it("throws on a login wall instead of returning an empty forecast", () => {
		expect(() =>
			parseForecastTable("<html><body>Non hai fatto Login</body></html>"),
		).toThrow(/login wall/i);
	});
});

/**
 * The columns the table was missing, read off a thermic day.
 *
 * Every one of these had the same root cause: the meaning is in the markup, not
 * in the text. The risk grading is an image, the reachable updrafts are a
 * colour, and both were being read with `.text()`, which sees neither.
 */
describe("parseForecastTable on a thermic day", () => {
	const table = parseForecastTable(thermals);
	const at = (hour: number) => table.hours.find((row) => row.hour === hour);

	/**
	 * Every row of this page grades LOW and prints no note at all, so a column
	 * read from the text alone is empty on all thirteen hours — which is exactly
	 * why the risk column had disappeared from the site.
	 */
	it("grades an hour from the icon, not from the note beside it", () => {
		expect(table.hours.every((row) => row.riskLevel === "low")).toBe(true);
		expect(table.hours.every((row) => row.risk === undefined)).toBe(true);
	});

	/**
	 * The glyph is the third thing this page says with markup rather than words,
	 * after the risk grading and the updraft colours — and the best hidden: its
	 * `<img>` carries no `alt` and no `title`, so the filename is the only place
	 * the reading exists.
	 */
	it("reads the weather glyph from the icon filename", () => {
		const graded = parseForecastTable(tappeti).hours;
		expect(graded.find((row) => row.hour === 7)?.weatherIcon).toBe("coperto");
		expect(graded.find((row) => row.hour === 8)?.weatherIcon).toBe("tempor");
		expect(graded.find((row) => row.hour === 9)?.weatherIcon).toBe("copiog");
		expect(graded.find((row) => row.hour === 19)?.weatherIcon).toBe("sereno");
	});

	/**
	 * Why the glyph is scraped at all rather than computed from the three
	 * percentages printed in the same cell. These two hours rank opposite ways
	 * under the two readings: the thermic page's 19:00 has no low cloud at all
	 * and the source still draws it overcast, while Borso's 07:00 has 27% and
	 * gets the clearer glyph. Any threshold over the stored figures orders them
	 * the wrong way round, so the glyph has to come from the markup.
	 */
	it("keeps a glyph the cloud percentages rank the other way round", () => {
		const overcast = parseForecastTable(thermals).hours.find(
			(row) => row.hour === 19,
		);
		const clearer = parseForecastTable(borso).hours.find(
			(row) => row.hour === 7,
		);
		expect(overcast?.weatherIcon).toBe("coperto");
		expect(clearer?.weatherIcon).toBe("poconuv");
		// More low cloud on the one the source draws as the clearer sky.
		expect(clearer?.cloudsLow).toBeGreaterThan(overcast?.cloudsLow ?? 0);
	});

	it("reads the three gradings the source publishes", () => {
		const graded = parseForecastTable(tappeti).hours;
		expect(graded.find((row) => row.hour === 7)?.riskLevel).toBe("medium");
		expect(graded.find((row) => row.hour === 8)?.riskLevel).toBe("high");
		expect(graded.find((row) => row.hour === 14)?.riskLevel).toBe("low");
		// The note stays alongside the grading rather than replacing it.
		expect(graded.find((row) => row.hour === 8)?.risk).toBe(
			"possible strong thunderstorm",
		);
	});

	/**
	 * The source colours an updraft green when a glider can reach it from
	 * take-off and red when it sits above the inversion. Taking the maximum of
	 * the whole list called this hour a 2311 m day; a pilot launching here tops
	 * out at 844 m.
	 */
	it("separates the updrafts a pilot can reach from the ones above the inversion", () => {
		expect(at(10)?.thermalUpdraftsM).toEqual([
			2311, 2048, 1794, 1547, 1307, 1072, 844, 620, 401,
		]);
		expect(at(10)?.reachableUpdraftsM).toEqual([844, 620, 401]);
	});

	/**
	 * The source's own headline figure, and the column this table had no trace
	 * of. Its bounds agree with the updraft colouring on every hour of every
	 * fixture: the top is the lowest red updraft, the bottom 50 m under the
	 * highest green one.
	 */
	it("reads the max flight altitude as bounds, not just as text", () => {
		expect(at(10)?.maxFlightAltitude).toBe("BETWEEN 794m AND 1072m");
		expect(at(10)?.maxFlightMinM).toBe(794);
		expect(at(10)?.maxFlightMaxM).toBe(1072);
	});

	it("leaves the max flight altitude unset on an hour without thermals", () => {
		expect(at(19)?.maxFlightAltitude).toBeUndefined();
		expect(at(19)?.maxFlightMinM).toBeUndefined();
	});

	/**
	 * An inversion is a band between two altitudes, and an hour can carry two of
	 * them. The old column kept the first number of the first band, so a pilot
	 * was shown the base of one layer with no top and no second layer at all.
	 */
	it("keeps both inversion bands of an hour that has two", () => {
		expect(at(10)?.stableLayers).toEqual([
			{ fromM: 1547, toM: 1794 },
			{ fromM: 2048, toM: 2311 },
		]);
	});

	it("reads a single merged band", () => {
		expect(at(11)?.stableLayers).toEqual([{ fromM: 1547, toM: 2311 }]);
	});

	/** Thermals stop long before the inversion does, so the column outlives them. */
	it("keeps the inversion on an hour that has no thermals left", () => {
		expect(at(19)?.thermalUpdraftsM).toEqual([]);
		expect(at(19)?.stableLayers).toEqual([{ fromM: 1526, toM: 1775 }]);
	});

	/** The evening hour whose base drops to take-off, with only a MAX to pair. */
	it("flags the hour whose cloud base reaches take-off", () => {
		expect(at(19)?.cloudBaseBelowTakeOff).toBe(true);
		expect(at(19)?.cloudBaseMinM).toBeUndefined();
		expect(at(19)?.cloudBaseMaxM).toBe(1075);
	});

	/**
	 * The page prints its refresh time in Rome local time with no zone on it.
	 * Reading it as UTC dated the scrape two hours in the future, so the site
	 * announced a forecast "updated at 12:15" while it was 11:50 in the valley.
	 */
	it("reads the source's refresh time as Rome local, not as UTC", () => {
		expect(thermals).toContain("September 24 2026 10:15:09");
		expect(table.updatedAt?.toISOString()).toBe("2026-09-24T08:15:09.000Z");
	});
});
