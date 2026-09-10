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
function report(
	folder: string,
	overrides: {
		error?: boolean;
		s3error?: string | null;
		totalFiles?: number;
		totalUploadedFiles?: number;
	} = {},
) {
	return {
		folder,
		error: false,
		s3error: null,
		totalFiles: 833,
		totalUploadedFiles: 833,
		startTime: new Date(`${folder}Z`),
		endTime: new Date(`${folder}Z`),
		...overrides,
	};
}

/** The shape the uploader stores when the S3 leg itself failed. */
const s3Failure = {
	error: true,
	s3error: '{"code":"ENOTFOUND"}',
	totalFiles: 1,
	totalUploadedFiles: 0,
};

/** A run whose frames are all in the bucket, but whose FTP mirror failed. */
const ftpFailure = { error: true };

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

	it("returns undefined when no run reached S3", async () => {
		// Nothing to draw: the frames were never published.
		mockFindMany.mockResolvedValue([
			report("2026-09-09T19:37:03.471", s3Failure),
		]);
		expect(await getElmeteoRuns()).toBeUndefined();
	});

	it("keeps a run whose frames reached S3 but whose FTP leg failed", async () => {
		// `error` is the OR of both legs, so it says nothing about the images.
		const ftpOnly = report("2026-09-09T22:37:00.000", ftpFailure);
		mockFindMany.mockResolvedValue([ftpOnly, today, earlier]);

		const result = await getElmeteoRuns();

		expect(result?.runs.map((run) => run.folder)).toEqual([
			ftpOnly.folder,
			today.folder,
			earlier.folder,
		]);
	});

	it("keeps the runs whose frames never reached S3 out of the timeline", async () => {
		const failed = report("2026-09-09T22:37:00.000", s3Failure);
		mockFindMany.mockResolvedValue([failed, today, earlier]);

		const result = await getElmeteoRuns();

		expect(result?.runs.map((run) => run.folder)).toEqual([
			today.folder,
			earlier.folder,
		]);
	});

	it("skips a run that stopped short of its last frame", async () => {
		// No error reported on either leg, yet a frame is missing: the run would
		// paint a hole in the grid.
		const partial = report("2026-09-09T22:37:00.000", {
			totalUploadedFiles: 832,
		});
		mockFindMany.mockResolvedValue([partial, today]);

		const result = await getElmeteoRuns();

		expect(result?.runs.map((run) => run.folder)).toEqual([today.folder]);
	});

	it("describes the same row in the timestamp and in the status", async () => {
		const ftpOnly = report("2026-09-09T22:37:00.000", ftpFailure);
		mockFindMany.mockResolvedValue([ftpOnly, today]);

		const result = await getElmeteoRuns();

		expect(result?.latest.folder).toBe(ftpOnly.folder);
		expect(result?.latest.updatedAt).toEqual(ftpOnly.endTime);
		// The maps come from this very run, and it did fail one of its legs.
		expect(result?.latest.error).toBe(true);
	});

	it("flags the failed uploads that came after the maps on screen", async () => {
		const failed = report("2026-09-09T22:37:00.000", s3Failure);
		mockFindMany.mockResolvedValue([failed, today, earlier]);

		const result = await getElmeteoRuns();

		// The header shows `today`, which succeeded, so without this the page would
		// look healthy while the uploader has stopped publishing.
		expect(result?.latest.folder).toBe(today.folder);
		expect(result?.failedUpload).toEqual({ at: failed.endTime, count: 1 });
	});

	it("counts every failed upload since the last usable run", async () => {
		const first = report("2026-09-09T22:37:00.000", s3Failure);
		const second = report("2026-09-10T01:37:00.000", s3Failure);
		mockFindMany.mockResolvedValue([second, first, today]);

		const result = await getElmeteoRuns();

		// Newest first: the timestamp shown is the most recent attempt.
		expect(result?.failedUpload).toEqual({ at: second.endTime, count: 2 });
	});

	it("reports no failed upload when the newest run is the usable one", async () => {
		// An older S3 failure is water under the bridge: the uploader recovered.
		const old = report("2026-09-09T13:37:00.000", s3Failure);
		mockFindMany.mockResolvedValue([today, earlier, old]);

		expect((await getElmeteoRuns())?.failedUpload).toBeUndefined();
	});

	it("does not count an FTP-only failure as a failed upload", async () => {
		const ftpOnly = report("2026-09-09T22:37:00.000", ftpFailure);
		mockFindMany.mockResolvedValue([ftpOnly, today]);

		const result = await getElmeteoRuns();

		// Its frames are on S3 and it *is* the run on screen, so the dot already
		// covers it through `latest.error`.
		expect(result?.failedUpload).toBeUndefined();
		expect(result?.latest.error).toBe(true);
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
		// green: the FTP-only failures would never be read.
		expect(mockFindMany).toHaveBeenCalledWith(
			expect.not.objectContaining({ where: expect.anything() }),
		);
	});
});
