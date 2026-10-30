"use server";

import { prisma } from "@/lib/prisma";
import { xcSeasonYear } from "@/lib/xc-season";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getXcEdition(
	category?: XcCategoryLevel,
	year = xcSeasonYear(),
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
