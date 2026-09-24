import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	cloudLayers,
	type ForecastHourView,
	formatCloudBase,
	formatHour,
	formatMaxFlight,
	getWindBand,
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
		riskLevel: null,
		risk: null,
		temperatureC: null,
		precipitationMm: null,
		maxFlightAltitude: null,
		maxFlightMinM: null,
		maxFlightMaxM: null,
		cloudBaseMinM: null,
		cloudBaseMaxM: null,
		cloudBaseBelowTakeOff: false,
		thermalUpdraftsM: [],
		reachableUpdraftsM: [],
		stableLayers: [],
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
	 * The source publishes three decks and a pilot reads them differently: 100%
	 * high cloud is cirrus you fly under, 100% low cloud is a lid on the day.
	 * Collapsing them to one figure threw that distinction away, so the view
	 * keeps all three in the order the source prints them.
	 */
	it("keeps the three decks in the source's H-M-L order", () => {
		expect(
			cloudLayers(hour({ cloudsHigh: 0, cloudsMedium: 72, cloudsLow: 81 })),
		).toEqual([
			{ layer: "high", cover: 0 },
			{ layer: "medium", cover: 72 },
			{ layer: "low", cover: 81 },
		]);
	});

	/**
	 * A deck the source left blank is not a clear one. Keeping it null rather
	 * than folding it to 0 is what lets the cell print a dash there instead of
	 * claiming a clear sky at that altitude.
	 */
	it("keeps an unpublished deck apart from a clear one", () => {
		expect(
			cloudLayers(hour({ cloudsHigh: 40, cloudsMedium: null, cloudsLow: 0 })),
		).toEqual([
			{ layer: "high", cover: 40 },
			{ layer: "medium", cover: null },
			{ layer: "low", cover: 0 },
		]);
	});

	it("returns null when no deck was published", () => {
		expect(cloudLayers(hour())).toBeNull();
	});
});

describe("thermals", () => {
	/**
	 * The figure a pilot plans around. The source models updrafts above the
	 * inversion too and colours those red — air that is rising, but that nothing
	 * launched from this take-off can reach. Taking the maximum of the whole list
	 * announced a 2310 m day on an hour whose real ceiling was 1071 m.
	 */
	it("takes the highest updraft that can be reached from take-off", () => {
		expect(
			topThermalM(
				hour({
					thermalUpdraftsM: [2310, 1071, 794],
					reachableUpdraftsM: [1071, 794],
				}),
			),
		).toBe(1071);
	});

	/**
	 * A layout change at the source that dropped the colouring would otherwise
	 * blank the column entirely; showing the unfiltered ceiling is a worse number
	 * but not a missing one.
	 */
	it("falls back to the full list when the source published no colours", () => {
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

describe("the updraft list", () => {
	/**
	 * What the cell's dialog shows. The table can only carry the reachable
	 * ceiling, but a pilot comparing it against the source's own table needs the
	 * red entries too — so the list keeps them, marked rather than dropped.
	 */
	it("lists every modelled updraft, highest first, marking the unreachable", () => {
		expect(
			updraftList(
				hour({
					thermalUpdraftsM: [794, 2310, 1071],
					reachableUpdraftsM: [1071, 794],
				}),
			),
		).toEqual([
			{ altitudeM: 2310, reachable: false, inInversion: false },
			{ altitudeM: 1071, reachable: true, inInversion: false },
			{ altitudeM: 794, reachable: true, inInversion: false },
		]);
	});

	/**
	 * The source stars exactly those altitudes that fall inside one of the same
	 * hour's inversion bands, which holds across every starred and unstarred line
	 * in the saved fixtures. Deriving the marking from the bands rather than
	 * storing it is what keeps the two from drifting apart.
	 */
	it("marks an updraft that sits inside one of the hour's inversion bands", () => {
		expect(
			updraftList(
				hour({
					thermalUpdraftsM: [1600, 1200],
					reachableUpdraftsM: [1600, 1200],
					stableLayers: [{ fromM: 1548, toM: 1795 }],
				}),
			),
		).toEqual([
			{ altitudeM: 1600, reachable: true, inInversion: true },
			{ altitudeM: 1200, reachable: true, inInversion: false },
		]);
	});

	/** The band is inclusive of its own bounds, as the source stars them. */
	it("marks an updraft sitting exactly on a band boundary", () => {
		const list = updraftList(
			hour({
				thermalUpdraftsM: [1795, 1548],
				stableLayers: [{ fromM: 1548, toM: 1795 }],
			}),
		);
		expect(list.map(({ inInversion }) => inInversion)).toEqual([true, true]);
	});

	/**
	 * Matching `topThermalM`: with no colours published at all, nothing is known
	 * to be out of reach, so the dialog must not paint the whole list red.
	 */
	it("treats every updraft as reachable when the source published no colours", () => {
		expect(
			updraftList(hour({ thermalUpdraftsM: [2266, 1499] })).every(
				({ reachable }) => reachable,
			),
		).toBe(true);
	});

	it("returns an empty list for an hour without thermal activity", () => {
		expect(updraftList(hour())).toEqual([]);
	});
});

describe("precipitation", () => {
	/**
	 * The column used to be dropped unless some hour expected rain, which meant
	 * every dry day showed no rain column at all — and a pilot could not tell
	 * "no rain forecast" from "we failed to scrape it". The source prints 0 mm on
	 * a dry hour for exactly that reason, so we keep the column whenever it
	 * published a figure.
	 */
	it("keeps the column on a dry day the source did publish", () => {
		expect(
			hasAnyPrecipitation([
				hour({ precipitationMm: 0 }),
				hour({ precipitationMm: 0 }),
			]),
		).toBe(true);
	});

	it("drops the column only when no hour carries a figure", () => {
		expect(hasAnyPrecipitation([hour(), hour()])).toBe(false);
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

	/**
	 * The grading lives in the icon and is published on every row, note or not.
	 * Keying the column off the note alone is why a day the source graded LOW
	 * all through showed no risk column at all.
	 */
	it("keeps the column for a graded day that printed no note", () => {
		expect(hasAnyRisk([hour({ riskLevel: "low" }), hour()])).toBe(true);
	});

	it("keeps the column for a note on an ungraded hour", () => {
		expect(hasAnyRisk([hour({ risk: "strong wind" })])).toBe(true);
	});

	it("drops the column on a day with neither", () => {
		expect(hasAnyRisk([hour(), hour()])).toBe(false);
	});
});

describe("cloud base", () => {
	it("joins the two bounds", () => {
		expect(
			formatCloudBase(hour({ cloudBaseMinM: 988, cloudBaseMaxM: 1288 })),
		).toEqual({ belowTakeOff: false, text: "988 - 1288 m" });
	});

	it("shows a single bound when only one was published", () => {
		expect(formatCloudBase(hour({ cloudBaseMaxM: 1288 }))?.text).toBe("1288 m");
		expect(formatCloudBase(hour({ cloudBaseMinM: 988 }))?.text).toBe("988 m");
	});

	it("returns null when neither bound was published", () => {
		expect(formatCloudBase(hour())).toBeNull();
	});

	/**
	 * "MIN same altitude or lower" is the one reading in this column a pilot must
	 * not misread as a ceiling. Keeping only the numbers turned it into a bare
	 * "1075 m", which says the opposite of what the hour is telling them.
	 */
	it("flags an hour whose base can sit at or below take-off", () => {
		expect(
			formatCloudBase(
				hour({ cloudBaseMaxM: 1075, cloudBaseBelowTakeOff: true }),
			),
		).toEqual({ belowTakeOff: true, text: "1075 m" });
	});

	it("flags it even without an upper bound to pair it with", () => {
		expect(formatCloudBase(hour({ cloudBaseBelowTakeOff: true }))).toEqual({
			belowTakeOff: true,
			text: null,
		});
	});
});

describe("max flight altitude", () => {
	/** How high a pilot gets from take-off on the day's thermals. */
	it("joins the two bounds", () => {
		expect(
			formatMaxFlight(hour({ maxFlightMinM: 794, maxFlightMaxM: 1072 })),
		).toBe("794 - 1072 m");
	});

	it("returns null for an hour the source left blank", () => {
		expect(formatMaxFlight(hour())).toBeNull();
	});

	it("drops the column on a day that publishes none", () => {
		expect(hasAnyMaxFlight([hour(), hour()])).toBe(false);
		expect(hasAnyMaxFlight([hour(), hour({ maxFlightMaxM: 1072 })])).toBe(true);
	});
});

describe("stable layers", () => {
	/** The base of the lowest band is where a climb is expected to stop. */
	it("leads with the base of the lowest band", () => {
		expect(
			lowestStableLayerM(
				hour({
					stableLayers: [
						{ fromM: 2049, toM: 2312 },
						{ fromM: 1548, toM: 1795 },
					],
				}),
			),
		).toBe(1548);
	});

	it("reports an hour without an inversion as null", () => {
		expect(lowestStableLayerM(hour())).toBeNull();
	});

	it("drops the column on a day that publishes none", () => {
		expect(hasAnyStableLayer([hour(), hour()])).toBe(false);
		expect(
			hasAnyStableLayer([
				hour(),
				hour({ stableLayers: [{ fromM: 1, toM: 2 }] }),
			]),
		).toBe(true);
	});
});

describe("hours", () => {
	it("pads to the HH:00 the source prints", () => {
		expect(formatHour(7)).toBe("07:00");
		expect(formatHour(19)).toBe("19:00");
	});
});
