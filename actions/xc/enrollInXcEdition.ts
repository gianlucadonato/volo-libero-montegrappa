"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getActiveXcEdition } from "@/lib/xc";
import { XcEnrollmentStatus } from "@/prisma/generated/enums";

export default async function enrollInXcEdition(editionId?: string) {
	const user = await getSessionUser();
	if (!user) {
		throw new Error("Unauthorized");
	}

	const edition = editionId
		? await prisma.xcEdition.findUnique({ where: { id: editionId } })
		: await getActiveXcEdition();

	if (!edition) {
		throw new Error("XC edition not found");
	}

	const enrollment = await prisma.xcEnrollment.upsert({
		where: {
			userId_editionId: {
				userId: user.id,
				editionId: edition.id,
			},
		},
		update: {
			status: XcEnrollmentStatus.ACTIVE,
		},
		create: {
			userId: user.id,
			editionId: edition.id,
			status: XcEnrollmentStatus.ACTIVE,
		},
	});

	return enrollment;
}
