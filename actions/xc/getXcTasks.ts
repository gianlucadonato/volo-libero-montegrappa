"use server";

import { prisma } from "@/lib/prisma";
import { xcSeasonYear } from "@/lib/xc-season";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getXcTasksByCategory(
	category: XcCategoryLevel,
	year = xcSeasonYear(),
) {
	const tasks = await prisma.xcTask.findMany({
		where: {
			category,
			editionTasks: {
				some: {
					editionId: year,
				},
			},
		},
		orderBy: { slug: "asc" },
	});

	return tasks;
}

export async function getXcTaskById(taskId: string) {
	const task = await prisma.xcTask.findUnique({
		where: { id: taskId },
	});
	return task;
}
