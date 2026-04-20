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

	if (!edition) return null;

	return {
		id: edition.id,
		title: edition.title,
		description: edition.description,
		startsAt: edition.startsAt,
		endsAt: edition.endsAt,
		isActive: edition.isActive,
		basicMinPoints: edition.basicMinPoints,
		interMinPoints: edition.interMinPoints,
		advMinPoints: edition.advMinPoints,
		createdAt: edition.createdAt,
		updatedAt: edition.updatedAt,
		tasks: edition.editionTasks.map((et) => et.task),
	};
}
