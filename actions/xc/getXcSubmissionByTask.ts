"use server";

import { prisma } from "@/lib/prisma";
import { xcSeasonYear } from "@/lib/xc-season";

export default async function getXcSubmissionByTask(
	userId: string,
	taskId: string,
	year = xcSeasonYear(),
) {
	return prisma.xcTrackSubmission.findFirst({
		where: {
			userId,
			taskId,
			editionId: year,
		},
	});
}
