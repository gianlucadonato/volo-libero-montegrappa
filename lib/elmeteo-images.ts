import "server-only";

import {
	mkdir,
	readdir,
	readFile,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { env } from "@/env";
import { buildFrameKey, clampStep } from "@/lib/elmeteo-run";
import { getObjectBytes } from "@/lib/s3";

/**
 * ElMeteo frames are ~520 KB PNGs and the bucket is private, so they are proxied
 * by the app. Re-downloading from S3 on every view would cost far more in S3
 * egress than the server itself, so each frame is converted once to WebP and
 * kept on disk.
 *
 * WebP at 800px/q85 keeps the burned-in header and legend legible while cutting
 * a frame to roughly a fifth of the PNG size.
 */
export const elmeteoImageWidth = 800;
export const elmeteoImageQuality = 85;
export const elmeteoImageContentType = "image/webp";

// Defaults to the OS temp dir, which is wiped on reboot: production should set
// ELMETEO_CACHE_DIR to a path that survives restarts and deploys.
const cacheRoot = env.ELMETEO_CACHE_DIR ?? path.join(tmpdir(), "elmeteo-cache");

export type ElmeteoFrameParams = {
	folder: string;
	map: string;
	step: number;
};

function getBucket() {
	if (!env.AWS_S3_ELMETEO_BUCKET) {
		throw new Error(
			"ElMeteo images are not configured: missing AWS_S3_ELMETEO_BUCKET",
		);
	}
	return env.AWS_S3_ELMETEO_BUCKET;
}

/**
 * Directory name a run's frames are cached under. Run folders contain ":",
 * which is legal on Linux but not everywhere, so it is swapped for "-". The
 * mapping is injective, so `cacheDirName` is enough to tell two runs apart.
 */
export function cacheDirName(folder: string) {
	return folder.replaceAll(":", "-");
}

function getCachePath(params: ElmeteoFrameParams) {
	// Every component is validated upstream (the folder against the uploader
	// naming, the map against the catalogue, the step against the run length),
	// and `basename` makes a traversal impossible even if that ever changes.
	const dir = path.basename(cacheDirName(params.folder));
	const file = `${path.basename(params.map)}_${clampStep(params.step)}.webp`;
	return path.join(cacheRoot, dir, file);
}

async function readCached(cachePath: string) {
	try {
		return await readFile(cachePath);
	} catch {
		return undefined;
	}
}

async function writeCached(cachePath: string, body: Buffer) {
	await mkdir(path.dirname(cachePath), { recursive: true });
	// Write to a temporary name first so a concurrent read never sees a partial
	// file: two requests for the same frame can race here.
	const tempPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`;
	await writeFile(tempPath, body);
	await rename(tempPath, cachePath);
}

/**
 * Returns a frame as WebP, converting and caching it on first request. Returns
 * undefined when the frame does not exist in the bucket.
 */
export async function getElmeteoFrame(params: ElmeteoFrameParams) {
	const cachePath = getCachePath(params);

	const cached = await readCached(cachePath);
	if (cached) {
		return { body: cached, cacheHit: true };
	}

	const original = await getObjectBytes({
		bucket: getBucket(),
		objectKey: buildFrameKey(params),
	});
	if (!original) {
		return undefined;
	}

	const body = await sharp(original)
		.resize({ width: elmeteoImageWidth, withoutEnlargement: true })
		.webp({ quality: elmeteoImageQuality })
		.toBuffer();

	await writeCached(cachePath, body);

	return { body, cacheHit: false };
}

/**
 * Decides which cache directories to drop, given the run folders still present
 * in the bucket. Anything that is not a directory of a still-present run is
 * expired: the frames it holds can no longer be re-fetched anyway.
 *
 * Returns an empty list when `keptFolders` is empty, so a transient empty
 * listing from S3 can never be read as "delete the whole cache".
 */
export function selectExpiredCacheDirs(
	cacheDirs: string[],
	keptFolders: string[],
) {
	if (keptFolders.length === 0) {
		return [];
	}

	const kept = new Set(keptFolders.map(cacheDirName));
	return cacheDirs.filter((dir) => !kept.has(dir));
}

/**
 * Removes cached frames belonging to runs that are no longer in the bucket.
 * Never throws: the cache is disposable, and losing it only costs a re-download.
 */
export async function pruneElmeteoCache(keptFolders: string[]) {
	let cacheDirs: string[];
	try {
		const entries = await readdir(cacheRoot, { withFileTypes: true });
		cacheDirs = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
	} catch {
		// The cache directory does not exist yet: nothing to prune.
		return { cacheRoot, removedDirs: [] as string[] };
	}

	const expired = selectExpiredCacheDirs(cacheDirs, keptFolders);

	const removedDirs: string[] = [];
	for (const dir of expired) {
		try {
			await rm(path.join(cacheRoot, dir), { recursive: true, force: true });
			removedDirs.push(dir);
		} catch {
			// A directory that cannot be removed (permissions, a race with a write)
			// is retried on the next cleanup rather than failing the whole prune.
		}
	}

	return { cacheRoot, removedDirs };
}
