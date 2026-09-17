import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { env } from "@/env";
import { cleanupElmeteoBucket, cleanupElmeteoReports } from "@/lib/elmeteo";
import { refreshForecasts } from "@/lib/elmeteo-forecast-refresh";
import { pruneElmeteoCache } from "@/lib/elmeteo-images";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
	const report = await prisma.report.findFirst({
		orderBy: {
			createdAt: "desc",
		},
	});
	return Response.json(report);
};

/**
 * Compares the bearer token in constant time. This endpoint also triggers the
 * S3 retention cleanup, so a leaked token means data loss, not just a bogus
 * report row.
 */
function isValidToken(token: string) {
	const expected = Buffer.from(env.ELMETEO_API_TOKEN);
	const received = Buffer.from(token);
	if (expected.length !== received.length) {
		return false;
	}
	return timingSafeEqual(expected, received);
}

export const POST = async (req: Request) => {
	const authorization = (await headers()).get("authorization");
	if (!authorization) {
		return Response.json({ error: "Not authenticated" }, { status: 401 });
	}
	const token = authorization.split(" ")[1];
	if (!token || !isValidToken(token)) {
		return Response.json({ error: "Not authenticated" }, { status: 401 });
	}

	const body = await req.json();
	await prisma.report.create({
		data: {
			folder: body.destFolder,
			s3startTime: new Date(body.amazonS3.startTime),
			s3endTime: body.amazonS3.endTime ? new Date(body.amazonS3.endTime) : null,
			s3duration: body.amazonS3.duration,
			s3error: body.amazonS3.error,
			ftpStartTime: new Date(body.ftp.startTime),
			ftpEndTime: body.ftp.endTime ? new Date(body.ftp.endTime) : null,
			ftpDuration: body.ftp.duration,
			ftpError: body.ftp.error,
			totalFiles: body.totalFiles,
			totalUploadedFiles: body.totalUploadedFiles,
			totalBytes: body.totalBytes,
			totalMegaBytes: body.totalUploadedMegaBytes,
			startTime: new Date(body.startTime),
			endTime: body.endTime ? new Date(body.endTime) : null,
			duration: body.duration,
			error: Boolean(body.error),
		},
	});

	logger.info(
		{
			folder: body.destFolder,
			totalUploadedFiles: body.totalUploadedFiles,
			totalFiles: body.totalFiles,
			error: Boolean(body.error),
		},
		"ElMeteo report saved",
	);

	// Scrape the forecasts and run retention after the response is sent: neither
	// must delay the uploader nor fail its report.
	after(async () => {
		// The report is the uploader telling us it has finished publishing a run,
		// which is also when the take-off tables have been recomputed — so this is
		// the moment to collect them, and no schedule has to guess at it.
		//
		// It runs before the retention work because that is the part that can
		// throw: a failing S3 cleanup returns early below, and the forecasts must
		// not be collateral damage of an unrelated bucket problem.
		try {
			await refreshForecasts("report");
		} catch (error) {
			logger.error(
				{ reason: error instanceof Error ? error.message : String(error) },
				"ElMeteo forecast scrape failed",
			);
		}

		// Report rows are dated by the same clock as the bucket, so this needs no
		// folder listing and runs first: it must not be skipped when S3 fails.
		try {
			const { deletedReports } = await cleanupElmeteoReports();
			logger.info({ deletedReports }, "ElMeteo reports cleanup completed");
		} catch (error) {
			logger.error({ error }, "ElMeteo reports cleanup failed");
		}

		let keptFolders: string[];

		try {
			const result = await cleanupElmeteoBucket();
			keptFolders = result.keptFolders;
			logger.info(
				{
					bucket: result.bucket,
					totalFolders: result.totalFolders,
					deletedFolders: result.deletedFolders,
					deletedObjects: result.deletedObjects,
				},
				"ElMeteo bucket cleanup completed",
			);
		} catch (error) {
			logger.error({ error }, "ElMeteo bucket cleanup failed");
			// Without a trustworthy folder listing the prune cannot tell a stale
			// cache entry from a live one, so it is skipped until the next report.
			return;
		}

		// Drop the cached frames of the runs that are now gone: they can no longer
		// be re-fetched, so they would just sit on disk forever.
		try {
			const pruned = await pruneElmeteoCache(keptFolders);
			logger.info(
				{
					cacheRoot: pruned.cacheRoot,
					removedDirs: pruned.removedDirs.length,
				},
				"ElMeteo cache prune completed",
			);
		} catch (error) {
			logger.error({ error }, "ElMeteo cache prune failed");
		}
	});

	return Response.json({ message: "Report saved!" });
};
