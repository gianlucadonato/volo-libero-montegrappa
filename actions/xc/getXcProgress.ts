"use server";

import { prisma } from "@/lib/prisma";
import { xcSeasonYear } from "@/lib/xc-season";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getXcProgressByCategory(
	userId: string,
	category: XcCategoryLevel,
	year = xcSeasonYear(),
) {
	const xcProgress = await prisma.xcProgress.findFirst({
		where: {
			category,
			userId,
			editionId: year,
		},
		include: {
			edition: true,
		},
	});
	return xcProgress;
}
