"use server";

import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getXcTasksByCategory(
	category: XcCategoryLevel,
	year = NEXT_YEAR,
) {
	const tasks = await prisma.xcTask.findMany({
		where: {
			category,
			editionTasks: {
				some: {
					edition: {
						year,
					},
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
