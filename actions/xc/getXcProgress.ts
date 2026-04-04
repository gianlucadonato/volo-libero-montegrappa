"use server";

import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getXcProgressByCategory(
	userId: string,
	category: XcCategoryLevel,
	year?: number,
) {
	const xcProgress = await prisma.xcProgress.findFirst({
		where: {
			category,
			userId,
			edition: {
				year: year ?? NEXT_YEAR,
			},
		},
		include: {
			edition: true,
		},
	});
	return xcProgress;
}
