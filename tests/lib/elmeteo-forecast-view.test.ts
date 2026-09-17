import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	type ForecastHourView,
	formatCloudBase,
	formatHour,
	getWindBand,
	hasAnyPrecipitation,
	hasAnyThermals,
	hasRisk,
	shortWindLabel,
	topThermalM,
	totalCloudCover,
	windBands,
} from "@/lib/elmeteo-forecast-view";

const fixture = (name: string) =>
	readFileSync(join(__dirname, "../fixtures/elmeteo", name), "utf8");

/** Minimal row, overridden per test. */
function hour(overrides: Partial<ForecastHourView> = {}): ForecastHourView {
	return {
		hour: 12,
		cloudsHigh: null,
		cloudsMedium: null,
		cloudsLow: null,
		risk: null,
		temperatureC: null,
		precipitationMm: null,
		maxFlightAltitude: null,
		cloudBaseMinM: null,
		cloudBaseMaxM: null,
		thermalUpdraftsM: [],
		stableLayerM: null,
		winds: [],
		...overrides,
	};
}

describe("wind bands", () => {
	/**
	 * The bands are not ours: elmeteo.it colours its own wind figures, and this
	 * reads those colours back out of the saved pages to confirm the thresholds
	 * still hold. If the source re-bands its table, this fails rather than
	 * letting our colours drift away from the ones pilots see on the origin.
	 */
	it("matches the thresholds the source colours its own tables with", () => {
		const speeds = new Map<string, number[]>([
			["plain", []],
			["orange", []],
			["red", []],
		]);

		for (const name of [
			"tappeti-authenticated.html",
			"panettone-public.html",
			"borso-public.html",
		]) {
			const html = fixture(name);
			// Only the wind cells: they are the ones carrying "km/h".
			for (const cell of html.match(/<td[^>]*>[\s\S]*?<\/td>/g) ?? []) {
				if (!cell.includes("km/h")) continue;
				for (const match of cell.matchAll(
					/<(span|b)([^>]*)>\s*(\d+(?:[.,]\d+)?)\s*<\/\1>/g,
				)) {
					const colour = /color:\s*([a-zA-Z]+)/.exec(match[2])?.[1] ?? "plain";
					speeds.get(colour)?.push(Number(match[3].replace(",", ".")));
				}
			}
		}

		const plain = speeds.get("plain") ?? [];
		const orange = speeds.get("orange") ?? [];
		const red = speeds.get("red") ?? [];

		// The fixtures must actually exercise all three, or this asserts nothing.
		expect(plain.length).toBeGreaterThan(0);
		expect(orange.length).toBeGreaterThan(0);
		expect(red.length).toBeGreaterThan(0);

		expect(Math.max(...plain)).toBeLessThan(windBands.moderate);
		expect(Math.min(...orange)).toBeGreaterThanOrEqual(windBands.moderate);
		expect(Math.max(...orange)).toBeLessThan(windBands.strong);
		expect(Math.min(...red)).toBeGreaterThanOrEqual(windBands.strong);
	});

	it("classifies each band at its boundary", () => {
		expect(getWindBand(11)).toBe("calm");
		expect(getWindBand(12)).toBe("moderate");
		expect(getWindBand(20)).toBe("moderate");
		expect(getWindBand(21)).toBe("strong");
	});

	/**
	 * A missing reading is not a calm one, but both render as a dash, so the
	 * cell never claims a measurement the source did not publish.
	 */
	it("treats a missing speed as calm rather than as zero", () => {
		expect(getWindBand(undefined)).toBe("calm");
		expect(getWindBand(0)).toBe("calm");
	});
});

describe("column labels", () => {
	it("shortens a free-atmosphere label to its altitude", () => {
		expect(shortWindLabel("Wind 1500m free atmos.")).toBe("1500m");
		expect(shortWindLabel("Wind 500m free atmos.")).toBe("500m");
	});

	/** "Wind 10m" has an altitude too, and it is what distinguishes it. */
	it("keeps the ground column distinguishable", () => {
		expect(shortWindLabel("Wind 10m")).toBe("10m");
	});
});

describe("cloud cover", () => {
	/**
	 * The three layers are cover percentages of the same sky, so the worst one
	 * is what blocks it. Summing would exceed 100; averaging would report a
	 * fully overcast low deck as "33% cloudy".
	 */
	it("reports the layer that blocks the most sky", () => {
		expect(
			totalCloudCover(hour({ cloudsHigh: 0, cloudsMedium: 72, cloudsLow: 81 })),
		).toBe(81);
		expect(
			totalCloudCover(
				hour({ cloudsHigh: 100, cloudsMedium: 100, cloudsLow: 6 }),
			),
		).toBe(100);
	});

	it("reads a partially published row", () => {
		expect(
			totalCloudCover(
				hour({ cloudsHigh: 40, cloudsMedium: null, cloudsLow: null }),
			),
		).toBe(40);
	});

	it("returns null when no layer was published", () => {
		expect(totalCloudCover(hour())).toBeNull();
	});
});

describe("thermals", () => {
	it("takes the highest ceiling of the hour", () => {
		expect(
			topThermalM(hour({ thermalUpdraftsM: [2266, 2003, 1748, 1499] })),
		).toBe(2266);
	});

	it("reports no thermal activity as null, not as zero", () => {
		expect(topThermalM(hour())).toBeNull();
	});

	/** The column is dropped on a day without thermals, which is most of winter. */
	it("detects whether a day has any thermal activity", () => {
		expect(hasAnyThermals([hour(), hour()])).toBe(false);
		expect(hasAnyThermals([hour(), hour({ thermalUpdraftsM: [1200] })])).toBe(
			true,
		);
	});
});

describe("precipitation", () => {
	/**
	 * The source publishes 0 mm on a dry hour rather than leaving the cell
	 * empty, so a presence check on the column would keep it on every dry day.
	 */
	it("ignores a day whose every hour publishes zero", () => {
		expect(
			hasAnyPrecipitation([
				hour({ precipitationMm: 0 }),
				hour({ precipitationMm: 0 }),
			]),
		).toBe(false);
	});

	it("keeps the column when any hour expects rain", () => {
		expect(
			hasAnyPrecipitation([
				hour({ precipitationMm: 0 }),
				hour({ precipitationMm: 1.2 }),
			]),
		).toBe(true);
	});
});

describe("risk", () => {
	it("reads a published note", () => {
		expect(hasRisk(hour({ risk: "thunderstorm not ruled out" }))).toBe(true);
	});

	/** The cell is whitespace rather than absent on a calm hour of some pages. */
	it("treats an empty or blank note as no risk", () => {
		expect(hasRisk(hour())).toBe(false);
		expect(hasRisk(hour({ risk: "" }))).toBe(false);
		expect(hasRisk(hour({ risk: "   " }))).toBe(false);
	});
});

describe("cloud base", () => {
	it("joins the two bounds", () => {
		expect(
			formatCloudBase(hour({ cloudBaseMinM: 988, cloudBaseMaxM: 1288 })),
		).toBe("988 - 1288 m");
	});

	it("shows a single bound when only one was published", () => {
		expect(formatCloudBase(hour({ cloudBaseMaxM: 1288 }))).toBe("1288 m");
		expect(formatCloudBase(hour({ cloudBaseMinM: 988 }))).toBe("988 m");
	});

	it("returns null when neither bound was published", () => {
		expect(formatCloudBase(hour())).toBeNull();
	});
});

describe("hours", () => {
	it("pads to the HH:00 the source prints", () => {
		expect(formatHour(7)).toBe("07:00");
		expect(formatHour(19)).toBe("19:00");
	});
});
