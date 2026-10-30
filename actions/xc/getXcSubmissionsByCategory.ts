"use server";

import { prisma } from "@/lib/prisma";
import { xcSeasonYear } from "@/lib/xc-season";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export default async function getXcSubmissionsByCategory(
	userId: string,
	category: XcCategoryLevel,
	year = xcSeasonYear(),
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
