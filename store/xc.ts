import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import type { XcEdition } from "@/prisma/generated/client";
import { XcCategoryLevel } from "@/prisma/generated/enums";

export async function getActiveXcEdition() {
	const now = new Date();
	return prisma.xcEdition.findFirst({
		where: {
			isActive: true,
			startsAt: { lte: now },
			endsAt: { gte: now },
		},
	});
}

export async function getXcEdition(year: number) {
	return prisma.xcEdition.findFirst({
		where: {
			year,
		},
	});
}

export async function getXcEnrollment({
	userId,
	year = NEXT_YEAR,
}: {
	userId: string;
	year?: number;
}) {
	return prisma.xcEnrollment.findFirst({
		where: {
			userId,
			edition: {
				year,
			},
		},
		include: {
			edition: true,
		},
	});
}

export function minPointsForCategory(
	category: XcCategoryLevel,
	edition: XcEdition,
): number {
	switch (category) {
		case XcCategoryLevel.BASIC:
			return edition.basicMinPoints;
		case XcCategoryLevel.INTERMEDIATE:
			return edition.interMinPoints;
		case XcCategoryLevel.ADVANCED:
			return edition.advMinPoints;
		default:
			return 9999;
	}
}
