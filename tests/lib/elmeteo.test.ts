import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ────────────────────────────────────────────────

vi.mock("@/env", () => ({
	env: { AWS_S3_ELMETEO_BUCKET: "elmeteo" },
}));

vi.mock("@/lib/s3", () => ({
	listTopLevelPrefixes: vi.fn(),
	deletePrefix: vi.fn(),
}));

import { cleanupElmeteoBucket, selectExpiredFolders } from "@/lib/elmeteo";
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
});
