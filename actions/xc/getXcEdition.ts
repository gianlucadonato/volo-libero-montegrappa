"use server";

import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getXcEdition(
	category?: XcCategoryLevel,
	year = NEXT_YEAR,
) {
	const edition = await prisma.xcEdition.findUnique({
		where: { id: year },
		include: {
			editionTasks: {
				include: { task: true },
				...(category ? { where: { task: { category } } } : {}),
				orderBy: { task: { slug: "asc" } },
			},
		},
	});
	return edition;
}
