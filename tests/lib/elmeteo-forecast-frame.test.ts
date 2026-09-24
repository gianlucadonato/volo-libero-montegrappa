import { describe, expect, it } from "vitest";
import {
	elmeteoFrameUrl,
	findForecastFrame,
	forecastCloudsMap,
	forecastThermalsMap,
} from "@/lib/elmeteo-forecast-frame";
import { buildElmeteoTimeline } from "@/lib/elmeteo-run";

// One 12:00 UTC run, which publishes 49 hourly frames reaching 12:00 UTC two
// days later — the shape the tables are read against.
const runs = [
	{
		folder: "2026-09-23T16:37:15.139",
		runStart: new Date("2026-09-23T12:00:00.000Z"),
	},
];
const slots = buildElmeteoTimeline(runs);

describe("findForecastFrame", () => {
	it("answers an hour of the table with the frame valid at it", () => {
		// 15:00 at the take-off is 13:00 UTC in September, an hour after the run,
		// so it is the run's step 1. Both sides caption that hour the same way —
		// the row reads "until 15:00" and the frame "until 15:00 (Rome)" — which
		// is what makes this an exact match rather than an approximation.
		expect(findForecastFrame(slots, "2026-09-23", 15)).toEqual({
			folder: "2026-09-23T16:37:15.139",
			step: 1,
		});
	});

	it("crosses into the next day", () => {
		// Day two of the table is comfortably inside a single run's reach.
		expect(findForecastFrame(slots, "2026-09-24", 8)).toEqual({
			folder: "2026-09-23T16:37:15.139",
			step: 18,
		});
	});

	it("gives up on the hours day three runs past", () => {
		// The tables reach 72 hours out and a run carries 49, so the last day
		// regularly has no frame at all. The column drops the link for those
		// hours rather than opening a dialog onto an image that does not exist.
		expect(findForecastFrame(slots, "2026-09-25", 19)).toBeUndefined();
	});

	it("refuses an hour before the timeline starts", () => {
		// `findSlotIndex` floors, so without the guard yesterday's 08:00 would
		// answer with the first slot — a frame describing a different day.
		expect(findForecastFrame(slots, "2026-09-22", 8)).toBeUndefined();
	});

	it("refuses an hour no run covers", () => {
		// An uploader outage leaves a hole in the middle of the timeline.
		// Flooring into it would answer with the frame from before the gap, so
		// the hour has to land on a slot exactly.
		const withGap = buildElmeteoTimeline([
			{ folder: "a", runStart: new Date("2026-09-20T12:00:00.000Z") },
			{ folder: "b", runStart: new Date("2026-09-23T12:00:00.000Z") },
		]).filter((slot) => slot.at.toISOString() !== "2026-09-23T13:00:00.000Z");

		expect(findForecastFrame(withGap, "2026-09-23", 15)).toBeUndefined();
		expect(findForecastFrame(withGap, "2026-09-23", 16)).toBeDefined();
	});

	it("prefers the newest run covering the hour", () => {
		// Two runs overlap for most of their range; the later one is the fresher
		// forecast, which is what the timeline already resolves.
		const overlapping = buildElmeteoTimeline([
			{ folder: "older", runStart: new Date("2026-09-23T00:00:00.000Z") },
			{ folder: "newer", runStart: new Date("2026-09-23T12:00:00.000Z") },
		]);

		expect(findForecastFrame(overlapping, "2026-09-23", 15)?.folder).toBe(
			"newer",
		);
	});

	it("follows Italy off summer time", () => {
		// The same table hour is an hour closer to a given run in winter, so a
		// fixed offset would pick the neighbouring frame for half the season.
		const winter = buildElmeteoTimeline([
			{ folder: "w", runStart: new Date("2026-12-23T12:00:00.000Z") },
		]);

		expect(findForecastFrame(winter, "2026-12-23", 15)).toEqual({
			folder: "w",
			step: 2,
		});
	});

	it("has nothing to answer with before any run exists", () => {
		expect(findForecastFrame([], "2026-09-23", 15)).toBeUndefined();
	});

	it("rejects a day it cannot parse", () => {
		expect(findForecastFrame(slots, "not-a-day", 15)).toBeUndefined();
	});
});

describe("elmeteoFrameUrl", () => {
	it("points at the club's own copy rather than at the source", () => {
		// Following a URL out of a scraped page is what the source's bot trap
		// punishes, so every frame is served from the app's proxy.
		expect(
			elmeteoFrameUrl("2026-09-23T16:37:15.139", forecastCloudsMap, 3),
		).toBe(
			"/api/elmeteo/frame?folder=2026-09-23T16%3A37%3A15.139&map=prec&step=3",
		);
	});
});

describe("the maps the columns read against", () => {
	it("names the club's copy of the source's own two", () => {
		// The clouds column's "Clouds Maps" link and the thermals column both
		// point at maps the club already mirrors, so neither has to send a
		// reader back to the source.
		expect(forecastCloudsMap).toBe("prec");
		expect(forecastThermalsMap).toBe("term950");
	});
});
