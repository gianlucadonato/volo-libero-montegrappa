import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────

vi.mock("@/env", () => ({
	env: { AWS_S3_ELMETEO_BUCKET: "elmeteo" },
}));

vi.mock("@/lib/s3", () => ({
	listTopLevelPrefixes: vi.fn(),
	deletePrefix: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		report: {
			findMany: vi.fn(),
			deleteMany: vi.fn(),
		},
	},
}));

import {
	cleanupElmeteoBucket,
	cleanupElmeteoReports,
	selectExpiredFolders,
	selectExpiredReports,
} from "@/lib/elmeteo";
import { prisma } from "@/lib/prisma";
import { deletePrefix, listTopLevelPrefixes } from "@/lib/s3";

const mockListTopLevelPrefixes = listTopLevelPrefixes as unknown as ReturnType<
	typeof vi.fn
>;
const mockDeletePrefix = deletePrefix as unknown as ReturnType<typeof vi.fn>;

// The uploader names folders after `new Date().toISOString()` minus the "Z".
const NOW = new Date("2026-09-09T16:57:34.628Z");

describe("selectExpiredFolders", () => {
	it("keeps the folders within the 3-week window", () => {
		const folders = [
			"2026-09-09T16:37:34.686", // today
			"2026-08-20T06:00:00.000", // 20 days old
			"2026-08-19T23:59:59.999", // 21 days old, exactly on the cutoff day
		];
		expect(selectExpiredFolders(folders, NOW)).toEqual([]);
	});

	it("selects the folders older than 3 weeks", () => {
		const folders = [
			"2026-09-09T16:37:34.686",
			"2026-08-18T06:00:00.000",
			"2026-07-01T12:00:00.000",
		];
		expect(selectExpiredFolders(folders, NOW)).toEqual([
			"2026-08-18T06:00:00.000",
			"2026-07-01T12:00:00.000",
		]);
	});

	it("ignores folders that do not match the uploader naming", () => {
		const folders = [
			"tasks",
			"backup-2020",
			"2026-07-01", // no time part
			"2026-07-01T12:00:00.000",
		];
		expect(selectExpiredFolders(folders, NOW)).toEqual([
			"2026-07-01T12:00:00.000",
		]);
	});

	it("supports folder names without milliseconds", () => {
		expect(selectExpiredFolders(["2026-07-01T12:00:00"], NOW)).toEqual([
			"2026-07-01T12:00:00",
		]);
	});
});

describe("cleanupElmeteoBucket", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("deletes only the expired prefixes and reports the totals", async () => {
		mockListTopLevelPrefixes.mockResolvedValue([
			"2026-09-09T16:37:34.686",
			"2026-08-18T06:00:00.000",
			"2026-07-01T12:00:00.000",
		]);
		mockDeletePrefix.mockResolvedValueOnce(120).mockResolvedValueOnce(80);

		const result = await cleanupElmeteoBucket(NOW);

		expect(mockDeletePrefix).toHaveBeenCalledTimes(2);
		expect(mockDeletePrefix).toHaveBeenNthCalledWith(1, {
			bucket: "elmeteo",
			prefix: "2026-08-18T06:00:00.000/",
		});
		expect(mockDeletePrefix).toHaveBeenNthCalledWith(2, {
			bucket: "elmeteo",
			prefix: "2026-07-01T12:00:00.000/",
		});
		expect(result).toEqual({
			bucket: "elmeteo",
			totalFolders: 3,
			deletedFolders: ["2026-08-18T06:00:00.000", "2026-07-01T12:00:00.000"],
			keptFolders: ["2026-09-09T16:37:34.686"],
			deletedObjects: 200,
		});
	});

	it("does nothing when everything is within the retention window", async () => {
		mockListTopLevelPrefixes.mockResolvedValue(["2026-09-09T16:37:34.686"]);

		const result = await cleanupElmeteoBucket(NOW);

		expect(mockDeletePrefix).not.toHaveBeenCalled();
		expect(result.deletedFolders).toEqual([]);
		expect(result.deletedObjects).toBe(0);
	});

	it("reports the folders that survived, so callers can prune their caches", async () => {
		const kept = "2026-09-09T16:37:34.686";
		const expired = "2026-07-01T04:36:12.001";
		vi.mocked(listTopLevelPrefixes).mockResolvedValue([expired, kept, "tasks"]);
		vi.mocked(deletePrefix).mockResolvedValue(833);

		const result = await cleanupElmeteoBucket(NOW);

		expect(result.deletedFolders).toEqual([expired]);
		// "tasks" is not an uploader folder: it is never deleted, so it stays kept.
		expect(result.keptFolders).toEqual([kept, "tasks"]);
		// Every listed folder is either deleted or kept, never both, never neither.
		expect([...result.deletedFolders, ...result.keptFolders].sort()).toEqual(
			[expired, kept, "tasks"].sort(),
		);
	});
});

describe("selectExpiredReports", () => {
	const report = (folder: string, createdAt: string) => ({
		id: folder,
		folder,
		createdAt: new Date(createdAt),
	});

	it("dates a report by its folder, on the same cutoff as the bucket", () => {
		const kept = report("2026-08-19T23:59:59.999", "2026-08-20T00:37:00.000Z");
		const expired = report(
			"2026-08-18T06:00:00.000",
			"2026-08-18T06:37:00.000Z",
		);

		expect(selectExpiredReports([kept, expired], NOW)).toEqual([expired]);
	});

	it("agrees with selectExpiredFolders on the folders they share", () => {
		const folders = [
			"2026-09-09T16:37:34.686",
			"2026-08-19T23:59:59.999",
			"2026-08-18T06:00:00.000",
			"2026-07-01T12:00:00.000",
		];
		// The row's own timestamp must not shift the verdict: only the folder does.
		const reports = folders.map((folder) =>
			report(folder, "2026-09-09T00:00:00.000Z"),
		);

		expect(selectExpiredReports(reports, NOW).map((r) => r.folder)).toEqual(
			selectExpiredFolders(folders, NOW),
		);
	});

	it("falls back to createdAt when the folder is not an uploader name", () => {
		const kept = report("manual-retry", "2026-09-01T10:00:00.000Z");
		const expired = report("manual-retry", "2026-07-01T10:00:00.000Z");

		expect(selectExpiredReports([kept, expired], NOW)).toEqual([expired]);
	});

	it("keeps a row inserted after midnight for a folder of the previous day", () => {
		// The uploader writes the row about an hour after the run folder, so the
		// two can land on different days. The folder is what decides.
		const row = report("2026-08-19T23:30:00.000", "2026-08-20T00:37:00.000Z");
		expect(selectExpiredReports([row], NOW)).toEqual([]);
	});
});

describe("cleanupElmeteoReports", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("deletes the expired rows and reports how many went", async () => {
		const expired = {
			id: "old",
			folder: "2026-07-01T12:00:00.000",
			createdAt: new Date("2026-07-01T12:37:00.000Z"),
		};
		vi.mocked(prisma.report.findMany).mockResolvedValue([
			expired,
			{
				id: "kept",
				folder: "2026-08-25T12:00:00.000",
				createdAt: new Date("2026-08-25T12:37:00.000Z"),
			},
		] as never);
		vi.mocked(prisma.report.deleteMany).mockResolvedValue({
			count: 1,
		} as never);

		const result = await cleanupElmeteoReports(NOW);

		expect(prisma.report.deleteMany).toHaveBeenCalledWith({
			where: { id: { in: ["old"] } },
		});
		expect(result).toEqual({ deletedReports: 1 });
	});

	it("asks the database for a day more than the cutoff", async () => {
		vi.mocked(prisma.report.findMany).mockResolvedValue([] as never);

		await cleanupElmeteoReports(NOW);

		// Cutoff day is 2026-08-19, so candidates run up to the start of the 20th:
		// a row inserted just after midnight still belongs to the 19th's folder.
		expect(prisma.report.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { createdAt: { lt: new Date("2026-08-20T00:00:00.000Z") } },
			}),
		);
	});

	it("does not issue a delete when nothing is expired", async () => {
		vi.mocked(prisma.report.findMany).mockResolvedValue([
			{
				id: "kept",
				folder: "2026-09-09T16:37:34.686",
				createdAt: new Date("2026-09-09T16:57:00.000Z"),
			},
		] as never);

		const result = await cleanupElmeteoReports(NOW);

		expect(prisma.report.deleteMany).not.toHaveBeenCalled();
		expect(result).toEqual({ deletedReports: 0 });
	});
});
