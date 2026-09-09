import { describe, expect, it } from "vitest";
import {
	buildFrameKey,
	clampStep,
	elmeteoMaxStep,
	getStepDate,
	getStepForDate,
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

	it("finds the step closest to a target instant", () => {
		expect(getStepForDate(runStart, new Date("2026-09-09T17:10:00Z"))).toBe(5);
		expect(getStepForDate(runStart, new Date("2026-09-09T17:40:00Z"))).toBe(6);
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
