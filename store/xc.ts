import { prisma } from "@/lib/prisma";
import { xcSeasonYear } from "@/lib/xc-season";

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
			id: year,
		},
	});
}

export async function getXcEnrollment({
	userId,
	year = xcSeasonYear(),
}: {
	userId: string;
	year?: number;
}) {
	return prisma.xcEnrollment.findFirst({
		where: {
			userId,
			editionId: year,
		},
		include: {
			edition: true,
		},
	});
}
