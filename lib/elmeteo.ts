import { env } from "@/env";
import { prisma } from "@/lib/prisma";
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

/**
 * Splits reports into the ones to delete and the ones to keep.
 *
 * A report row is the index of a run: once the run's folder is gone from the
 * bucket there are no frames left to describe, so rows follow the same
 * retention as the objects they point at. Rows whose folder does not follow the
 * uploader naming cannot be dated that way and fall back to their insertion
 * time, which trails the run by about five hours — nothing against three weeks.
 */
export function selectExpiredReports<
	T extends { folder: string; createdAt: Date },
>(reports: readonly T[], now = new Date()) {
	const cutoffDay = getCutoffDay(now);

	return reports.filter((report) => {
		const match = folderPattern.exec(report.folder);
		return match
			? match[1] < cutoffDay
			: report.createdAt.toISOString().slice(0, 10) < cutoffDay;
	});
}

/**
 * Deletes the report rows of runs that are no longer in the bucket.
 *
 * Unlike the cache prune this needs no bucket listing: expiry is decided by the
 * same clock that drives `cleanupElmeteoBucket`, so the two stay in step by
 * construction and this can still run when the S3 cleanup fails.
 */
export async function cleanupElmeteoReports(now = new Date()) {
	// `folder` sorts lexicographically, but comparing it in the query would run
	// under the database collation. The candidates are narrowed on `createdAt`, a
	// real timestamp, and the cutoff is then applied in JS with the same
	// semantics as the bucket's.
	//
	// The window is widened by a day because a row trails its folder by about an
	// hour: a run uploaded at 23:30 on the last expired day is inserted after
	// midnight, so cutting the candidates at the cutoff itself would leave it
	// behind forever. Over-selecting here is free — `selectExpiredReports` makes
	// the real decision.
	const candidates = await prisma.report.findMany({
		where: {
			createdAt: {
				lt: new Date(
					new Date(`${getCutoffDay(now)}T00:00:00.000Z`).getTime() +
						millisecondsPerDay,
				),
			},
		},
		select: { id: true, folder: true, createdAt: true },
	});

	const expired = selectExpiredReports(candidates, now);
	if (expired.length === 0) {
		return { deletedReports: 0 };
	}

	const { count } = await prisma.report.deleteMany({
		where: { id: { in: expired.map((report) => report.id) } },
	});

	return { deletedReports: count };
}
