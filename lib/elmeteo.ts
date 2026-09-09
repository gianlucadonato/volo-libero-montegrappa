import { env } from "@/env";
import { deletePrefix, listTopLevelPrefixes } from "@/lib/s3";

/** How many weeks of ElMeteo uploads are kept in the S3 bucket. */
export const ELMETEO_RETENTION_WEEKS = 3;

const retentionDays = ELMETEO_RETENTION_WEEKS * 7;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

/**
 * The external uploader names each run's folder after `new Date().toISOString()`
 * without the trailing "Z" (e.g. "2026-09-09T16:37:34.686"), so the timestamps
 * are UTC and sort lexicographically.
 */
const folderPattern = /^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

function getElmeteoBucket() {
	if (!env.AWS_S3_ELMETEO_BUCKET) {
		throw new Error(
			"ElMeteo cleanup is not configured: missing AWS_S3_ELMETEO_BUCKET",
		);
	}
	return env.AWS_S3_ELMETEO_BUCKET;
}

/**
 * Returns the UTC day (YYYY-MM-DD) before which folders are considered expired.
 */
function getCutoffDay(now: Date) {
	return new Date(now.getTime() - retentionDays * millisecondsPerDay)
		.toISOString()
		.slice(0, 10);
}

/**
 * Picks the upload folders older than the retention window. Anything that does
 * not look like an uploader-generated folder is left untouched.
 */
export function selectExpiredFolders(folders: string[], now = new Date()) {
	const cutoffDay = getCutoffDay(now);

	return folders.filter((folder) => {
		const match = folderPattern.exec(folder);
		if (!match) return false;
		return match[1] < cutoffDay;
	});
}

/**
 * Deletes the ElMeteo upload folders older than the retention window, keeping
 * only the last `ELMETEO_RETENTION_WEEKS` weeks in the bucket.
 */
export async function cleanupElmeteoBucket(now = new Date()) {
	const bucket = getElmeteoBucket();
	const folders = await listTopLevelPrefixes(bucket);
	const expiredFolders = selectExpiredFolders(folders, now);
	const expired = new Set(expiredFolders);

	let deletedObjects = 0;
	for (const folder of expiredFolders) {
		deletedObjects += await deletePrefix({
			bucket,
			prefix: `${folder}/`,
		});
	}

	return {
		bucket,
		totalFolders: folders.length,
		deletedFolders: expiredFolders,
		// What survived the prune, so callers can drop anything they cache for the
		// runs that are gone.
		keptFolders: folders.filter((folder) => !expired.has(folder)),
		deletedObjects,
	};
}
