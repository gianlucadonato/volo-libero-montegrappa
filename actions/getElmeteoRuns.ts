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
 * Every ElMeteo run still worth showing, newest first, the metadata of the
 * latest usable one, and the outcome of the latest upload attempt.
 *
 * Failed uploads are read too but never enter the timeline: a run that errored
 * may have published only part of its frames. They still decide the status
 * shown in the header, which would otherwise report success while the uploader
 * has been failing for a day.
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
			totalUploadedFiles: true,
		},
	});

	const parsed = reports.flatMap((report) => {
		const runStart = parseRunStart(report.folder);
		return runStart ? [{ ...report, runStart }] : [];
	});

	// The newest row of all, error or not: this is what the status dot reports.
	const lastAttempt = parsed[0];

	const succeeded = parsed.filter((report) => !report.error);
	const latest = succeeded[0];
	if (!latest || !lastAttempt) {
		return undefined;
	}

	// The window is anchored to the newest run, not to now: if the uploader
	// stops, the page keeps offering the last fortnight it did publish instead of
	// shrinking towards empty.
	const from = getTimelineStart(latest.runStart, elmeteoHistoryDays);

	// A run is kept when its 48 hours reach into the window, not merely when it
	// starts inside it: the run covering the first hours of the window was
	// published a few hours before the window opens.
	const runs: ElmeteoRun[] = succeeded
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
		lastAttempt: {
			error: lastAttempt.error,
			at: lastAttempt.endTime ?? lastAttempt.startTime,
		},
	};
}
