"use server";

import { prisma } from "@/lib/prisma";
import { getActiveXcEdition } from "@/lib/xc";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getXcTasksByCategory(
	category: XcCategoryLevel,
	year?: number,
) {
	if (!year) {
		const activeEdition = await getActiveXcEdition();
		if (!activeEdition) {
			throw new Error("No active XC edition found");
		}
		year = activeEdition.year;
	}

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
