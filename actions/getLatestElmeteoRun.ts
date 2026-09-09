import { parseRunStart } from "@/lib/elmeteo-run";
import { prisma } from "@/lib/prisma";

/**
 * Latest successfully uploaded ElMeteo run, with the model run instant derived
 * from the folder name. Reports with a broken or unparseable folder are skipped
 * so a single bad upload does not blank out the page.
 */
export default async function getLatestElmeteoRun() {
	const reports = await prisma.report.findMany({
		where: { error: false },
		orderBy: { createdAt: "desc" },
		take: 5,
		select: {
			folder: true,
			endTime: true,
			startTime: true,
			totalUploadedFiles: true,
		},
	});

	for (const report of reports) {
		const runStart = parseRunStart(report.folder);
		if (runStart) {
			return {
				folder: report.folder,
				runStart,
				updatedAt: report.endTime ?? report.startTime,
				totalUploadedFiles: report.totalUploadedFiles,
			};
		}
	}

	return undefined;
}
