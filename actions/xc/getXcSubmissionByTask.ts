"use server";

import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";

export default async function getXcSubmissionByTask(
	userId: string,
	taskId: string,
	year = NEXT_YEAR,
) {
	return prisma.xcTrackSubmission.findFirst({
		where: {
			userId,
			taskId,
			editionId: year,
		},
	});
}
