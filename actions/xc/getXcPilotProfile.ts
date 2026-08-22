"use server";

import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { PILOT_FLIGHT_TASK_SELECT, toPilotFlight } from "@/lib/xc-flight";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { getXcLeaderboardRank } from "./getXcLeaderboard";

const CATEGORY_ORDER: XcCategoryLevel[] = [
	XcCategoryLevel.BASIC,
	XcCategoryLevel.INTERMEDIATE,
	XcCategoryLevel.ADVANCED,
];

export interface XcPilotIdentity {
	id: string;
	firstName: string;
	lastName: string;
	image: string | null;
}

/**
 * Public, minimal pilot lookup used by the XC profile page (`/xc/users/[id]`).
 * Exposes only the identity fields already shown on the public leaderboard.
 * Soft-deleted users are excluded.
 */
export async function getXcPilotIdentity(
	userId: string,
): Promise<XcPilotIdentity | null> {
	return prisma.user.findFirst({
		where: { id: userId, deletedAt: null },
		select: { id: true, firstName: true, lastName: true, image: true },
	});
}

/**
 * Public XC profile for a pilot, scoped to the XC Montegrappa competition:
 * per-category progress for one edition plus the approved flights of that
 * edition. Never exposes personal data beyond name and avatar, and never
 * exposes submissions that have not been approved.
 */
export async function getXcPilotProfile(userId: string, editionId?: number) {
	const user = await getXcPilotIdentity(userId);
	if (!user) return null;

	const editions = await prisma.xcEdition.findMany({
		where: {
			OR: [
				{ xcProgresses: { some: { userId } } },
				{ submissions: { some: { userId, status: "APPROVED" } } },
			],
		},
		select: { id: true, title: true, isActive: true },
		orderBy: { id: "desc" },
	});

	const selectedEditionId =
		editionId && editions.some((e) => e.id === editionId)
			? editionId
			: (editions[0]?.id ?? NEXT_YEAR);

	const [edition, progresses, editionTasks, flights, totals, flightCount] =
		await Promise.all([
			prisma.xcEdition.findUnique({
				where: { id: selectedEditionId },
				select: {
					id: true,
					title: true,
					minPoints: true,
					maxPoints: true,
					isActive: true,
				},
			}),
			prisma.xcProgress.findMany({
				where: { userId, editionId: selectedEditionId },
			}),
			prisma.xcEditionTasks.findMany({
				where: { editionId: selectedEditionId },
				select: { task: { select: { category: true } } },
			}),
			prisma.xcTrackSubmission.findMany({
				where: {
					userId,
					editionId: selectedEditionId,
					status: "APPROVED",
				},
				include: { task: { select: PILOT_FLIGHT_TASK_SELECT } },
				orderBy: { createdAt: "desc" },
			}),
			prisma.xcProgress.aggregate({
				where: { userId },
				_sum: { points: true, totalDistanceKm: true, flightTimeHrs: true },
				_max: { maxAltM: true },
			}),
			prisma.xcTrackSubmission.count({
				where: { userId, status: "APPROVED" },
			}),
		]);

	const levelsCompleted = await prisma.xcProgress.count({
		where: { userId, completedAt: { not: null } },
	});

	const tasksTotalByCategory = new Map<XcCategoryLevel, number>();
	for (const { task } of editionTasks) {
		tasksTotalByCategory.set(
			task.category,
			(tasksTotalByCategory.get(task.category) ?? 0) + 1,
		);
	}

	const progressByCategory = new Map(progresses.map((p) => [p.category, p]));

	const categories = await Promise.all(
		CATEGORY_ORDER.map(async (category) => {
			const progress = progressByCategory.get(category);
			const completedTaskIds = new Set(
				flights
					.filter((f) => f.task.category === category)
					.map((f) => f.taskId),
			);

			const { rank, totalPilots } =
				progress && progress.points > 0
					? await getXcLeaderboardRank(userId, category, selectedEditionId)
					: { rank: null, totalPilots: 0 };

			return {
				category,
				points: progress?.points ?? 0,
				minPoints: edition?.minPoints ?? progress?.minPoints ?? 0,
				maxPoints: edition?.maxPoints ?? 0,
				rank,
				totalPilots,
				tasksCompleted: completedTaskIds.size,
				tasksTotal: tasksTotalByCategory.get(category) ?? 0,
				totalDistanceKm: progress?.totalDistanceKm ?? 0,
				flightTimeHrs: progress?.flightTimeHrs ?? 0,
				maxAltM: progress?.maxAltM ?? 0,
				completedAt: progress?.completedAt ?? null,
			};
		}),
	);

	return {
		user,
		editions,
		edition,
		totals: {
			points: totals._sum.points ?? 0,
			flights: flightCount,
			totalDistanceKm: totals._sum.totalDistanceKm ?? 0,
			flightTimeHrs: totals._sum.flightTimeHrs ?? 0,
			maxAltM: totals._max.maxAltM ?? 0,
			levelsCompleted,
		},
		categories,
		flights: flights.map(toPilotFlight),
	};
}
