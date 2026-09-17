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
	 * read: the MIN must stay undefined rather than pick up the 1700.
	 */
	it("parses the cloud base bounds, tolerating a textual MIN", () => {
		const midday = parseForecastTable(panettone).hours.find(
			(hour) => hour.hour === 12,
		);
		expect(midday?.cloudBaseMinM).toBeUndefined();
		expect(midday?.cloudBaseMaxM).toBe(1700);
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
