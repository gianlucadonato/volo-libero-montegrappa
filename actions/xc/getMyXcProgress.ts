import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { resolveMinPointsByCategory } from "@/lib/xc";
import { XcSubmissionStatus } from "@/prisma/generated/enums";

export default async function getMyXcProgress(year?: number) {
	const user = await getSessionUser();
	if (!user) {
		return null;
	}

	const edition = await prisma.xcEdition.findFirst({
		where: year ? { year } : { isActive: true },
		orderBy: { year: "desc" },
		include: {
			enrollments: {
				where: { userId: user.id },
			},
			categories: {
				orderBy: { level: "asc" },
				include: {
					tasks: {
						where: { isPublished: true },
						orderBy: { points: "asc" },
						include: {
							submissions: {
								where: { userId: user.id },
								orderBy: { createdAt: "desc" },
								take: 1,
							},
						},
					},
				},
			},
			achievements: {
				where: { userId: user.id },
			},
		},
	});

	if (!edition) {
		return null;
	}

	const isEnrolled = edition.enrollments.length > 0;

	const achievementsByCategory = new Map(
		edition.achievements.map((achievement) => [
			achievement.categoryId,
			achievement,
		]),
	);

	return {
		editionId: edition.id,
		year: edition.year,
		title: edition.title,
		isEnrolled,
		categories: edition.categories.map((category) => {
			const achievement = achievementsByCategory.get(category.id);
			const minPoints = resolveMinPointsByCategory(
				category.level,
				category.minPoints,
				{
					basicMinPoints: edition.basicMinPoints,
					interMinPoints: edition.interMinPoints,
					advMinPoints: edition.advMinPoints,
				},
			);
			return {
				id: category.id,
				level: category.level,
				title: category.title,
				minPoints,
				points: achievement?.points ?? 0,
				completed: (achievement?.points ?? 0) >= minPoints,
				tasks: category.tasks.map((task) => {
					const latestSubmission = task.submissions[0] ?? null;
					return {
						id: task.id,
						slug: task.slug,
						name: task.name,
						points: task.points,
						distanceKm: task.distanceKm,
						latestSubmissionStatus:
							latestSubmission?.status ?? XcSubmissionStatus.PENDING,
						hasSubmission: Boolean(latestSubmission),
					};
				}),
			};
		}),
	};
}
