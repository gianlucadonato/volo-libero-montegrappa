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
 * fortnight needs ~60 rows; the rest is slack for the error rows and unparseable
 * folders that are filtered out afterwards.
 */
const reportsToScan = 200;

/**
 * Every ElMeteo run still worth showing, newest first, plus the metadata of the
 * latest one for the page header.
 *
 * Reports whose folder does not follow the uploader naming are skipped so a
 * single bad upload does not blank out the page.
 */
export default async function getElmeteoRuns() {
	const reports = await prisma.report.findMany({
		where: { error: false },
		orderBy: { createdAt: "desc" },
		take: reportsToScan,
		select: {
			folder: true,
			endTime: true,
			startTime: true,
			totalUploadedFiles: true,
		},
	});

	const parsed = reports.flatMap((report) => {
		const runStart = parseRunStart(report.folder);
		return runStart ? [{ ...report, runStart }] : [];
	});

	const latest = parsed[0];
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
	const runs: ElmeteoRun[] = parsed
		.filter((report) => getStepDate(report.runStart, elmeteoMaxStep) >= from)
		.map(({ folder, runStart }) => ({ folder, runStart }));

	return {
		runs,
		latest: {
			folder: latest.folder,
			runStart: latest.runStart,
			updatedAt: latest.endTime ?? latest.startTime,
			totalUploadedFiles: latest.totalUploadedFiles,
		},
	};
}
