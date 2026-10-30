"use server";

import Boom from "@hapi/boom";
import { prisma } from "@/lib/prisma";
import { xcSeasonYear } from "@/lib/xc-season";
import { getXcEdition } from "@/store/xc";

export default async function createXcEnrollment({
	userId,
	year = xcSeasonYear(),
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
