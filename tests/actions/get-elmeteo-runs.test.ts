import { beforeEach, describe, expect, it, vi } from "vitest";
import getElmeteoRuns from "@/actions/getElmeteoRuns";

// ── Mocks ────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
	prisma: {
		report: { findMany: vi.fn() },
	},
}));

// Import mocked modules to set up return values
import { prisma } from "@/lib/prisma";

const mockFindMany = prisma.report.findMany as unknown as ReturnType<
	typeof vi.fn
>;

// ── Fixtures ─────────────────────────────────────────────

/** A report row as the uploader writes it, newest first in the query result. */
function report(folder: string, error = false) {
	return {
		folder,
		error,
		startTime: new Date(`${folder}Z`),
		endTime: new Date(`${folder}Z`),
		totalUploadedFiles: 784,
	};
}

// Four uploads a day, matching the real schedule.
const today = report("2026-09-09T19:37:03.471");
const earlier = report("2026-09-09T16:37:34.686");

describe("getElmeteoRuns", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns undefined when no report can be dated", async () => {
		mockFindMany.mockResolvedValue([report("tasks"), report("backup")]);
		expect(await getElmeteoRuns()).toBeUndefined();
	});

	it("returns undefined when every upload failed", async () => {
		// Nothing usable to draw: a partial run must not reach the timeline.
		mockFindMany.mockResolvedValue([report("2026-09-09T19:37:03.471", true)]);
		expect(await getElmeteoRuns()).toBeUndefined();
	});

	it("reports the last attempt, not the last success", async () => {
		const failed = report("2026-09-09T22:37:00.000", true);
		mockFindMany.mockResolvedValue([failed, today, earlier]);

		const result = await getElmeteoRuns();

		// The dot must show the failure even though the maps come from `today`.
		expect(result?.lastAttempt.error).toBe(true);
		expect(result?.latest.folder).toBe(today.folder);
	});

	it("keeps failed runs out of the timeline", async () => {
		const failed = report("2026-09-09T22:37:00.000", true);
		mockFindMany.mockResolvedValue([failed, today, earlier]);

		const result = await getElmeteoRuns();

		expect(result?.runs.map((run) => run.folder)).toEqual([
			today.folder,
			earlier.folder,
		]);
	});

	it("drops the runs whose 48 hours no longer reach the window", async () => {
		const old = report("2026-08-01T04:38:00.000");
		mockFindMany.mockResolvedValue([today, old]);

		const result = await getElmeteoRuns();

		expect(result?.runs.map((run) => run.folder)).toEqual([today.folder]);
	});

	it("reads failed rows too, so the status is not filtered away", async () => {
		mockFindMany.mockResolvedValue([today]);

		await getElmeteoRuns();

		// A `where: { error: false }` here would make the status dot permanently
		// green: the failing rows would never be read.
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.not.objectContaining({ where: expect.anything() }),
		);
	});
});
