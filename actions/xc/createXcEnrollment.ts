"use server";

import Boom from "@hapi/boom";
import { NEXT_YEAR } from "@/config/constants";
import { prisma } from "@/lib/prisma";
import { XcCategoryLevel } from "@/prisma/generated/enums";
import { getXcEdition, minPointsForCategory } from "@/store/xc";

export default async function createXcEnrollment({
	userId,
	year = NEXT_YEAR,
}: {
	userId: string;
	year?: number;
}) {
	const edition = await getXcEdition(year);
	if (!edition) {
		throw Boom.notFound(`Xc edition not found for year ${year}`);
	}

	// Check if user is already enrolled in this edition
	const existingEnrollment = await prisma.xcEnrollment.findUnique({
		where: {
			userId_editionId: {
				userId,
				editionId: edition.id,
			},
		},
	});

	if (existingEnrollment) {
		throw Boom.conflict("You are already enrolled in this edition!");
	}

	const enrollment = await prisma.xcEnrollment.create({
		data: {
			userId,
			editionId: edition.id,
		},
		include: {
			edition: true,
		},
	});

	return enrollment;
}
