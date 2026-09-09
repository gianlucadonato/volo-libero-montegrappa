import { mkdir, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheRoot = path.join(tmpdir(), `elmeteo-cache-test-${process.pid}`);

vi.mock("@/env", () => ({
	env: {
		AWS_S3_ELMETEO_BUCKET: "elmeteo",
		ELMETEO_CACHE_DIR: cacheRoot,
	},
}));

vi.mock("@/lib/s3", () => ({ getObjectBytes: vi.fn() }));
vi.mock("server-only", () => ({}));

const { cacheDirName, pruneElmeteoCache, selectExpiredCacheDirs } =
	await import("@/lib/elmeteo-images");

const oldRun = "2026-08-19T04:36:12.001";
const keptRun = "2026-09-09T16:37:34.686";

async function seedCache(folders: string[]) {
	for (const folder of folders) {
		const dir = path.join(cacheRoot, cacheDirName(folder));
		await mkdir(dir, { recursive: true });
		await writeFile(path.join(dir, "term950_5.webp"), "frame");
	}
}

describe("cacheDirName", () => {
	it("replaces the colons that a run folder carries", () => {
		expect(cacheDirName(keptRun)).toBe("2026-09-09T16-37-34.686");
	});

	it("keeps distinct runs distinct", () => {
		expect(cacheDirName(oldRun)).not.toBe(cacheDirName(keptRun));
	});
});

describe("selectExpiredCacheDirs", () => {
	it("keeps the directories of runs still in the bucket", () => {
		expect(
			selectExpiredCacheDirs(
				[cacheDirName(oldRun), cacheDirName(keptRun)],
				[keptRun],
			),
		).toEqual([cacheDirName(oldRun)]);
	});

	it("drops directories that match no run at all", () => {
		expect(selectExpiredCacheDirs(["stray-dir"], [keptRun])).toEqual([
			"stray-dir",
		]);
	});

	it("never wipes the cache when the bucket listing comes back empty", () => {
		// A transient S3 failure must not be read as "every run is gone".
		expect(selectExpiredCacheDirs([cacheDirName(keptRun)], [])).toEqual([]);
	});

	it("returns nothing when every directory is still current", () => {
		expect(selectExpiredCacheDirs([cacheDirName(keptRun)], [keptRun])).toEqual(
			[],
		);
	});
});

describe("pruneElmeteoCache", () => {
	beforeEach(async () => {
		await rmCache();
	});

	afterEach(async () => {
		await rmCache();
	});

	async function rmCache() {
		const { rm } = await import("node:fs/promises");
		await rm(cacheRoot, { recursive: true, force: true });
	}

	it("removes the expired run directory and leaves the current one", async () => {
		await seedCache([oldRun, keptRun]);

		const result = await pruneElmeteoCache([keptRun]);

		expect(result.removedDirs).toEqual([cacheDirName(oldRun)]);
		expect(await readdir(cacheRoot)).toEqual([cacheDirName(keptRun)]);
	});

	it("is a no-op when the cache directory does not exist yet", async () => {
		const result = await pruneElmeteoCache([keptRun]);
		expect(result.removedDirs).toEqual([]);
	});

	it("leaves everything in place when the kept list is empty", async () => {
		await seedCache([oldRun, keptRun]);

		const result = await pruneElmeteoCache([]);

		expect(result.removedDirs).toEqual([]);
		expect((await readdir(cacheRoot)).sort()).toEqual(
			[cacheDirName(oldRun), cacheDirName(keptRun)].sort(),
		);
	});
});
