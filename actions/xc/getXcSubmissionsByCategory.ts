"use server";

import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export default async function getXcSubmissionsByCategory(
	userId: string,
	category: XcCategoryLevel,
	year = NEXT_YEAR,
) {
	return prisma.xcTrackSubmission.findMany({
		where: {
			userId,
			editionId: year,
			task: {
				category,
			},
		},
	});
}
