"use server";

import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import type { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getXcLeaderboardByCategory(
	category: XcCategoryLevel,
	year = NEXT_YEAR,
) {
	const progresses = await prisma.xcProgress.findMany({
		where: {
			category,
			editionId: year,
			points: { gt: 0 },
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
		orderBy: [
			{ points: "desc" },
			{ completedAt: { sort: "asc", nulls: "last" } },
			{ updatedAt: "asc" },
		],
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
