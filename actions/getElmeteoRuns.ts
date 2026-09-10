import {
	type ElmeteoRun,
	elmeteoHistoryDays,
	elmeteoMaxStep,
	getStepDate,
	getTimelineStart,
	parseRunStart,
} from "@/lib/elmeteo-run";
import { prisma } from "@/lib/prisma";

/**
 * Reports read before the history window is applied. Four runs a day means a
 * fortnight needs ~60 rows; the rest is slack for the failed runs and
 * unparseable folders that are filtered out afterwards.
 */
const reportsToScan = 200;

/**
 * Whether a run's frames actually reached the bucket the maps are served from.
 *
 * `error` is the OR of two independent legs, S3 and FTP, so it is not a verdict
 * on the images: the vast majority of error rows are FTP failures whose frames
 * uploaded in full. Only the S3 leg matters here, and `s3error` is null exactly
 * when it succeeded. The file count is a second guard: a leg can report no error
 * and still stop short of the last frame.
 */
function hasFramesOnS3(report: {
	s3error: string | null;
	totalFiles: number;
	totalUploadedFiles: number;
}) {
	return (
		report.s3error === null &&
		report.totalUploadedFiles === report.totalFiles &&
		report.totalFiles > 0
	);
}

/**
 * Every ElMeteo run whose frames are in the bucket and still worth showing,
 * newest first, plus the metadata of the latest one.
 *
 * A run enters the timeline when its files reached S3, whatever the FTP leg did:
 * the frames are there to be drawn, and dropping them would blank out hours the
 * bucket can serve. `latest` is that same newest usable run, so the timestamp in
 * the header, the status dot and the maps all describe one row.
 *
 * Reports whose folder does not follow the uploader naming are skipped so a
 * single bad upload does not blank out the page.
 */
export default async function getElmeteoRuns() {
	const reports = await prisma.report.findMany({
		orderBy: { createdAt: "desc" },
		take: reportsToScan,
		select: {
			folder: true,
			endTime: true,
			startTime: true,
			error: true,
			s3error: true,
			totalFiles: true,
			totalUploadedFiles: true,
		},
	});

	const usable = reports.flatMap((report) => {
		if (!hasFramesOnS3(report)) return [];
		const runStart = parseRunStart(report.folder);
		return runStart ? [{ ...report, runStart }] : [];
	});

	const latest = usable[0];
	if (!latest) {
		return undefined;
	}

	// The window is anchored to the newest run, not to now: if the uploader
	// stops, the page keeps offering the last fortnight it did publish instead of
	// shrinking towards empty.
	const from = getTimelineStart(latest.runStart, elmeteoHistoryDays);

	// A run is kept when its 48 hours reach into the window, not merely when it
	// starts inside it: the run covering the first hours of the window was
	// published a few hours before the window opens.
	const runs: ElmeteoRun[] = usable
		.filter((report) => getStepDate(report.runStart, elmeteoMaxStep) >= from)
		.map(({ folder, runStart }) => ({ folder, runStart }));

	return {
		runs,
		latest: {
			folder: latest.folder,
			runStart: latest.runStart,
			updatedAt: latest.endTime ?? latest.startTime,
			totalUploadedFiles: latest.totalUploadedFiles,
			// The maps are there, but the run may still have failed its other leg:
			// the dot reports the health of the very row shown above it.
			error: latest.error,
		},
	};
}
