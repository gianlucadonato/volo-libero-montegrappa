import { prisma } from "@/lib/prisma";
import { XcCategoryLevel, XcSubmissionStatus } from "@/prisma/generated/enums";

export async function getActiveXcEdition() {
	const now = new Date();

	return prisma.xcEdition.findFirst({
		where: {
			isActive: true,
			startsAt: { lte: now },
			endsAt: { gte: now },
		},
		include: {
			categories: {
				orderBy: { level: "asc" },
				include: {
					tasks: {
						where: { isPublished: true },
						orderBy: { points: "asc" },
						include: {
							waypoints: {
								orderBy: { orderIndex: "asc" },
							},
						},
					},
				},
			},
		},
	});
}

export function resolveMinPointsByCategory(
	level: XcCategoryLevel,
	fallbackCategoryMinPoints: number,
	editionThresholds: {
		basicMinPoints: number;
		interMinPoints: number;
		advMinPoints: number;
	},
) {
	if (fallbackCategoryMinPoints > 0) {
		return fallbackCategoryMinPoints;
	}

	switch (level) {
		case XcCategoryLevel.BASIC:
			return editionThresholds.basicMinPoints;
		case XcCategoryLevel.INTERMEDIATE:
			return editionThresholds.interMinPoints;
		case XcCategoryLevel.ADVANCED:
			return editionThresholds.advMinPoints;
	}
}

export async function recomputeXcAchievementsForUser(params: {
	userId: string;
	editionId: string;
}) {
	const [approvedSubmissions, edition] = await Promise.all([
		prisma.xcTrackSubmission.findMany({
			where: {
				userId: params.userId,
				editionId: params.editionId,
				status: XcSubmissionStatus.APPROVED,
			},
			include: {
				task: {
					include: {
						category: true,
					},
				},
			},
		}),
		prisma.xcEdition.findUnique({
			where: { id: params.editionId },
			include: { categories: true },
		}),
	]);

	if (!edition) {
		throw new Error("XC edition not found");
	}

	const categoryScores = new Map<string, number>();
	for (const submission of approvedSubmissions) {
		const categoryId = submission.task.categoryId;
		const current = categoryScores.get(categoryId) ?? 0;
		categoryScores.set(
			categoryId,
			current + (submission.pointsAwarded ?? submission.task.points),
		);
	}

	await prisma.$transaction(
		edition.categories.map((category) => {
			const points = categoryScores.get(category.id) ?? 0;
			const minPoints = resolveMinPointsByCategory(
				category.level,
				category.minPoints,
				{
					basicMinPoints: edition.basicMinPoints,
					interMinPoints: edition.interMinPoints,
					advMinPoints: edition.advMinPoints,
				},
			);

			return prisma.xcAchievement.upsert({
				where: {
					userId_editionId_categoryId: {
						userId: params.userId,
						editionId: params.editionId,
						categoryId: category.id,
					},
				},
				update: {
					points,
					achievedAt: points >= minPoints ? new Date() : null,
				},
				create: {
					userId: params.userId,
					editionId: params.editionId,
					categoryId: category.id,
					points,
					achievedAt: points >= minPoints ? new Date() : null,
				},
			});
		}),
	);
}
