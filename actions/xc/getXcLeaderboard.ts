"use server";

import { prisma } from "@/lib/prisma";
import { xcSeasonYear } from "@/lib/xc-season";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

const leaderboardOrderBy = [
	{ points: "desc" as const },
	{ completedAt: { sort: "asc" as const, nulls: "last" as const } },
	{ updatedAt: "asc" as const },
];

export async function getXcLeaderboardByCategory(
	category: XcCategoryLevel,
	year = xcSeasonYear(),
) {
	const progresses = await prisma.xcProgress.findMany({
		where: {
			category,
			editionId: year,
			points: { gt: 0 },
			user: { deletedAt: null },
		},
		include: {
			user: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					image: true,
				},
			},
		},
		orderBy: leaderboardOrderBy,
	});

	return progresses.map((p, idx) => ({
		rank: idx + 1,
		userId: p.userId,
		firstName: p.user.firstName,
		lastName: p.user.lastName,
		image: p.user.image,
		points: p.points,
		totalDistanceKm: p.totalDistanceKm,
		flightTimeHrs: p.flightTimeHrs,
		maxAltM: p.maxAltM,
		completedAt: p.completedAt,
	}));
}

/**
 * Position of a single pilot in a category leaderboard. Uses the exact same
 * filter and ordering as `getXcLeaderboardByCategory` so the rank shown on a
 * pilot profile matches the one shown on the leaderboard page.
 */
export async function getXcLeaderboardRank(
	userId: string,
	category: XcCategoryLevel,
	year = xcSeasonYear(),
) {
	const progresses = await prisma.xcProgress.findMany({
		where: {
			category,
			editionId: year,
			points: { gt: 0 },
			user: { deletedAt: null },
		},
		select: { userId: true },
		orderBy: leaderboardOrderBy,
	});

	const index = progresses.findIndex((p) => p.userId === userId);

	return {
		rank: index === -1 ? null : index + 1,
		totalPilots: progresses.length,
	};
}
