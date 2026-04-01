"use server";

import { prisma } from "@/lib/prisma";
import { getActiveXcEdition } from "@/lib/xc";

export async function getXcTasksByCategory(
	categoryLevel: "BASIC" | "INTERMEDIATE" | "ADVANCED",
	year?: number,
) {
	try {
		const edition =
			year &&
			(await prisma.xcEdition.findFirst({
				where: { year },
				include: {
					categories: {
						where: { level: categoryLevel },
						include: {
							tasks: {
								where: { isPublished: true },
								orderBy: { name: "asc" },
							},
						},
					},
				},
			}));

		if (!edition) {
			const activeEdition = await getActiveXcEdition();
			if (!activeEdition) {
				throw new Error("No active XC edition found");
			}

			const category = activeEdition.categories.find(
				(c) => c.level === categoryLevel,
			);
			if (!category) {
				throw new Error(`No category found for level: ${categoryLevel}`);
			}

			return category.tasks;
		}

		const category = edition.categories[0];
		return category?.tasks || [];
	} catch (error) {
		console.error("Error fetching XC tasks:", error);
		throw error;
	}
}

export async function getXcTaskById(taskId: string) {
	try {
		const task = await prisma.xcTask.findUnique({
			where: { id: taskId },
			include: {
				category: {
					include: {
						edition: true,
					},
				},
				waypoints: {
					orderBy: { orderIndex: "asc" },
				},
				submissions: {
					take: 5,
					orderBy: { createdAt: "desc" },
				},
			},
		});

		return task;
	} catch (error) {
		console.error("Error fetching XC task:", error);
		throw error;
	}
}

export async function getXcAllTasksForEdition(year?: number) {
	try {
		const edition =
			year &&
			(await prisma.xcEdition.findFirst({
				where: { year },
				include: {
					categories: {
						include: {
							tasks: {
								where: { isPublished: true },
								orderBy: { name: "asc" },
							},
						},
					},
				},
			}));

		if (!edition) {
			const activeEdition = await getActiveXcEdition();
			if (!activeEdition) {
				throw new Error("No active XC edition found");
			}

			return activeEdition.categories.flatMap((c) => c.tasks);
		}

		return edition.categories.flatMap((c) => c.tasks);
	} catch (error) {
		console.error("Error fetching all XC tasks:", error);
		throw error;
	}
}
