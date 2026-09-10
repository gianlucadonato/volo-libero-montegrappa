import { describe, expect, it } from "vitest";
import {
	buildElmeteoTimeline,
	buildFrameKey,
	clampStep,
	elmeteoHistoryDays,
	elmeteoMaxStep,
	elmeteoStepCount,
	findSlotIndex,
	getStepDate,
	getStepForDate,
	getTimelineStart,
	parseRunStart,
} from "@/lib/elmeteo-run";

describe("parseRunStart", () => {
	it("derives the model run from the upload folder, four hours earlier", () => {
		// Verified against the run hour printed inside the images of this folder.
		expect(parseRunStart("2026-09-09T16:37:34.686")?.toISOString()).toBe(
			"2026-09-09T12:00:00.000Z",
		);
	});

	it("handles the other three daily uploads", () => {
		expect(parseRunStart("2026-09-09T04:36:12.001")?.toISOString()).toBe(
			"2026-09-09T00:00:00.000Z",
		);
		expect(parseRunStart("2026-09-09T07:40:00.500")?.toISOString()).toBe(
			"2026-09-09T03:00:00.000Z",
		);
		expect(parseRunStart("2026-09-09T19:37:02.123")?.toISOString()).toBe(
			"2026-09-09T15:00:00.000Z",
		);
	});

	it("rolls back across midnight", () => {
		expect(parseRunStart("2026-09-10T02:36:00.000")?.toISOString()).toBe(
			"2026-09-09T22:00:00.000Z",
		);
	});

	it("accepts folders without milliseconds", () => {
		expect(parseRunStart("2026-09-09T16:37:34")?.toISOString()).toBe(
			"2026-09-09T12:00:00.000Z",
		);
	});

	it("rejects folders that do not follow the uploader naming", () => {
		expect(parseRunStart("tasks")).toBeUndefined();
		expect(parseRunStart("2026-09-09")).toBeUndefined();
		expect(parseRunStart("backup-2026-09-09T16:37:34.686")).toBeUndefined();
	});
});

describe("clampStep", () => {
	it("keeps steps inside the published range", () => {
		expect(clampStep(-5)).toBe(0);
		expect(clampStep(0)).toBe(0);
		expect(clampStep(24)).toBe(24);
		expect(clampStep(elmeteoMaxStep)).toBe(elmeteoMaxStep);
		expect(clampStep(120)).toBe(elmeteoMaxStep);
		expect(clampStep(Number.NaN)).toBe(0);
	});
});

describe("getStepDate", () => {
	it("treats the step as an hourly offset from the run", () => {
		const runStart = new Date("2026-09-09T12:00:00.000Z");
		expect(getStepDate(runStart, 0).toISOString()).toBe(
			"2026-09-09T12:00:00.000Z",
		);
		// Step 5 of this run renders as "until 19:00 (Rome)", i.e. 17:00 UTC.
		expect(getStepDate(runStart, 5).toISOString()).toBe(
			"2026-09-09T17:00:00.000Z",
		);
		expect(getStepDate(runStart, elmeteoMaxStep).toISOString()).toBe(
			"2026-09-11T12:00:00.000Z",
		);
	});
});

describe("getStepForDate", () => {
	const runStart = new Date("2026-09-09T12:00:00.000Z");

	it("finds the step whose hour is under way, never the next one", () => {
		expect(getStepForDate(runStart, new Date("2026-09-09T17:00:00Z"))).toBe(5);
		expect(getStepForDate(runStart, new Date("2026-09-09T17:10:00Z"))).toBe(5);
		// Rounding up here would show a forecast for an hour that has not started.
		expect(getStepForDate(runStart, new Date("2026-09-09T17:40:00Z"))).toBe(5);
		expect(getStepForDate(runStart, new Date("2026-09-09T17:59:59Z"))).toBe(5);
		expect(getStepForDate(runStart, new Date("2026-09-09T18:00:00Z"))).toBe(6);
	});

	it("clamps targets outside the run window", () => {
		expect(getStepForDate(runStart, new Date("2026-09-09T06:00:00Z"))).toBe(0);
		expect(getStepForDate(runStart, new Date("2026-09-20T00:00:00Z"))).toBe(
			elmeteoMaxStep,
		);
	});
});

describe("buildFrameKey", () => {
	it("builds the object key of a frame", () => {
		expect(
			buildFrameKey({
				folder: "2026-09-09T16:37:34.686",
				map: "term950",
				step: 12,
			}),
		).toBe("2026-09-09T16:37:34.686/nord/term950_12.png");
	});

	it("clamps out-of-range steps instead of building a missing key", () => {
		expect(
			buildFrameKey({
				folder: "2026-09-09T16:37:34.686",
				map: "t_2m",
				step: 99,
			}),
		).toBe(`2026-09-09T16:37:34.686/nord/t_2m_${elmeteoMaxStep}.png`);
	});
});

describe("buildElmeteoTimeline", () => {
	// Four runs a day, exactly as the uploader publishes them.
	const run = (iso: string) => ({
		folder: `${iso.replace("Z", "")}-upload`,
		runStart: new Date(iso),
	});

	it("prefers the newest run that covers an hour", () => {
		const older = {
			folder: "older",
			runStart: new Date("2026-09-09T00:00:00Z"),
		};
		const newer = {
			folder: "newer",
			runStart: new Date("2026-09-09T12:00:00Z"),
		};
		const slots = buildElmeteoTimeline([older, newer]);

		const at = (iso: string) =>
			slots.find((slot) => slot.at.toISOString() === iso);

		// 06:00 is only reachable from the older run.
		expect(at("2026-09-09T06:00:00.000Z")).toMatchObject({
			folder: "older",
			step: 6,
		});
		// 18:00 is covered by both: the newer run has the shorter lead time.
		expect(at("2026-09-09T18:00:00.000Z")).toMatchObject({
			folder: "newer",
			step: 6,
		});
	});

	it("is hourly, sorted and free of duplicates", () => {
		const slots = buildElmeteoTimeline([
			run("2026-09-09T00:00:00Z"),
			run("2026-09-09T12:00:00Z"),
			run("2026-09-08T12:00:00Z"),
		]);

		// Two runs 12h apart plus one 24h earlier: 48h of coverage from the newest,
		// extended backwards by the 24h the older ones add.
		expect(slots).toHaveLength(48 + 24 + 1);
		for (let i = 1; i < slots.length; i++) {
			expect(slots[i].at.getTime() - slots[i - 1].at.getTime()).toBe(3600_000);
		}
		expect(slots[0].at.toISOString()).toBe("2026-09-08T12:00:00.000Z");
		expect(slots[slots.length - 1].at.toISOString()).toBe(
			"2026-09-11T12:00:00.000Z",
		);
	});

	it("drops the hours older than the history window", () => {
		const slots = buildElmeteoTimeline(
			[run("2026-08-01T00:00:00Z"), run("2026-09-09T12:00:00Z")],
			2,
		);

		// The August run is entirely outside a 2-day window: nothing of it survives,
		// so the timeline starts at the September run rather than at the window.
		expect(
			slots.every((slot) => slot.folder !== "2026-08-01T00:00:00-upload"),
		).toBe(true);
		expect(slots[0].at.toISOString()).toBe("2026-09-09T12:00:00.000Z");
		expect(slots).toHaveLength(elmeteoStepCount);
	});

	it("keeps the tail of a run that reaches into the window", () => {
		// This run starts before the window but its later steps fall inside it.
		const slots = buildElmeteoTimeline(
			[run("2026-09-08T00:00:00Z"), run("2026-09-09T12:00:00Z")],
			2,
		);

		expect(slots[0]).toMatchObject({
			folder: "2026-09-08T00:00:00-upload",
			// 2026-09-07T12:00Z is before this run, so the window opens at its start.
			step: 0,
		});
		expect(slots[0].at.toISOString()).toBe("2026-09-08T00:00:00.000Z");
	});

	it("returns nothing when there are no runs", () => {
		expect(buildElmeteoTimeline([])).toEqual([]);
	});
});

describe("findSlotIndex", () => {
	const slots = buildElmeteoTimeline([
		{ folder: "run", runStart: new Date("2026-09-09T12:00:00Z") },
	]);

	it("finds the slot whose hour is under way, never the next one", () => {
		expect(
			slots[
				findSlotIndex(slots, new Date("2026-09-09T17:00:00Z"))
			].at.toISOString(),
		).toBe("2026-09-09T17:00:00.000Z");
		expect(
			slots[
				findSlotIndex(slots, new Date("2026-09-09T17:59:59Z"))
			].at.toISOString(),
		).toBe("2026-09-09T17:00:00.000Z");
		expect(
			slots[
				findSlotIndex(slots, new Date("2026-09-09T18:00:00Z"))
			].at.toISOString(),
		).toBe("2026-09-09T18:00:00.000Z");
	});

	it("clamps outside the timeline", () => {
		// Before the first slot: the timeline opens on its earliest hour.
		expect(findSlotIndex(slots, new Date("2026-01-01T00:00:00Z"))).toBe(0);
		// After the last: the newest forecast available.
		expect(findSlotIndex(slots, new Date("2026-12-01T00:00:00Z"))).toBe(
			slots.length - 1,
		);
	});
});

describe("getTimelineStart", () => {
	it("counts the window back from the newest run", () => {
		expect(
			getTimelineStart(new Date("2026-09-09T15:00:00Z"), 14).toISOString(),
		).toBe("2026-08-26T15:00:00.000Z");
	});

	it("defaults to the configured history window", () => {
		const latest = new Date("2026-09-09T15:00:00Z");
		expect(getTimelineStart(latest).getTime()).toBe(
			latest.getTime() - elmeteoHistoryDays * 24 * 3600_000,
		);
	});
});
